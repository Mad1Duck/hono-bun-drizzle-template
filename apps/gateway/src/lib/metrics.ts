import type { Context, Next } from 'hono';

type LatencySample = {
  route: string;
  ms: number;
  status: number;
};

const MAX_SAMPLES = 10_000;

const samples: LatencySample[] = [];
const routeCounters = new Map<string, { total: number; errors: number }>();
const registeredBreakers = new Map<string, { getState: () => string | Promise<string> }>();

const routeKey = (method: string, path: string): string => `${method} ${path}`;

export const recordRequest = (method: string, path: string, ms: number, status: number): void => {
  const key = routeKey(method, path);
  const counter = routeCounters.get(key) ?? { total: 0, errors: 0 };
  counter.total += 1;
  if (status >= 400) {
    counter.errors += 1;
  }
  routeCounters.set(key, counter);

  samples.push({ route: key, ms, status });
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
};

export const registerCircuitBreaker = (
  target: string,
  breaker: { getState: () => string | Promise<string> },
): void => {
  registeredBreakers.set(target, breaker);
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const escapeLabel = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

let scrapeCount = 0;

export const getMetrics = async (): Promise<string> => {
  scrapeCount += 1;
  const lines: string[] = [];

  lines.push('# HELP gateway_uptime_seconds Service uptime in seconds');
  lines.push('# TYPE gateway_uptime_seconds gauge');
  lines.push(`gateway_uptime_seconds ${Math.floor(process.uptime())}`);

  lines.push('# HELP gateway_scrape_total Total number of metrics scrapes');
  lines.push('# TYPE gateway_scrape_total counter');
  lines.push(`gateway_scrape_total ${scrapeCount}`);

  // Latency percentiles per route
  const routeGroups = new Map<string, number[]>();
  for (const s of samples) {
    const list = routeGroups.get(s.route) ?? [];
    list.push(s.ms);
    routeGroups.set(s.route, list);
  }

  for (const [route, ms] of routeGroups) {
    const sorted = ms.slice().sort((a, b) => a - b);
    const label = `route="${escapeLabel(route)}"`;
    lines.push(`# HELP gateway_request_duration_milliseconds Request latency`);
    lines.push(`# TYPE gateway_request_duration_milliseconds summary`);
    lines.push(`gateway_request_duration_milliseconds{${label},quantile="0.5"} ${percentile(sorted, 50)}`);
    lines.push(`gateway_request_duration_milliseconds{${label},quantile="0.95"} ${percentile(sorted, 95)}`);
    lines.push(`gateway_request_duration_milliseconds{${label},quantile="0.99"} ${percentile(sorted, 99)}`);
  }

  // Error rate per route
  lines.push('# HELP gateway_requests_total Total requests by route');
  lines.push('# TYPE gateway_requests_total counter');
  lines.push('# HELP gateway_request_errors_total Failed requests by route');
  lines.push('# TYPE gateway_request_errors_total counter');
  for (const [route, counter] of routeCounters) {
    const label = `route="${escapeLabel(route)}"`;
    lines.push(`gateway_requests_total{${label}} ${counter.total}`);
    lines.push(`gateway_request_errors_total{${label}} ${counter.errors}`);
  }

  // Circuit breaker state
  lines.push('# HELP gateway_circuit_breaker_state Circuit breaker state (0=closed, 1=half-open, 2=open)');
  lines.push('# TYPE gateway_circuit_breaker_state gauge');
  const breakerEntries = Array.from(registeredBreakers.entries());
  const breakerStates = await Promise.all(
    breakerEntries.map(async ([target, breaker]) => {
      const raw = await breaker.getState();
      const normalized = String(raw).toUpperCase();
      let value = 0;
      if (normalized === 'HALF_OPEN') value = 1;
      if (normalized === 'OPEN') value = 2;
      return { target, value };
    }),
  );
  for (const { target, value } of breakerStates) {
    const label = `target="${escapeLabel(target)}"`;
    lines.push(`gateway_circuit_breaker_state{${label}} ${value}`);
  }

  return lines.join('\n') + '\n';
};

export const metricsMiddleware = async (c: Context, next: Next): Promise<void> => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  recordRequest(c.req.method, c.req.path, ms, c.res.status);
};
