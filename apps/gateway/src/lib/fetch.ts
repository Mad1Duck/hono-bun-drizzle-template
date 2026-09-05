import { env } from '../config/env';

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is OPEN') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// NOTE: Circuit breaker state is in-process per gateway instance.
// Untuk horizontal scaling, pertimbangkan distributed circuit breaker yang disinkronkan
// via Redis atau coordination service agar semua instance melihat state yang sama.
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private nextAttempt = 0;
  private halfOpenPending = false;

  constructor(
    private failureThreshold = env.PROXY_CIRCUIT_BREAKER_THRESHOLD,
    private resetTimeoutMs = env.PROXY_CIRCUIT_BREAKER_RESET_MS,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitOpenError();
      }
      this.state = 'HALF_OPEN';
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenPending) {
      throw new CircuitOpenError('Circuit breaker is HALF_OPEN and already probing');
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenPending = true;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    } finally {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenPending = false;
      }
    }
  }

  private recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }
}

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = env.PROXY_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

type ResilienceOptions = {
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
  breaker?: CircuitBreaker;
};

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof CircuitOpenError) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return false;
};

const isIdempotent = (init: RequestInit): boolean => {
  const method = (init.method ?? 'GET').toUpperCase();
  if (IDEMPOTENT_METHODS.has(method)) return true;

  const headers = init.headers;
  if (headers instanceof Headers) return headers.has('Idempotency-Key');
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === 'idempotency-key');
  }
  if (headers && typeof headers === 'object') {
    return Object.keys(headers).some((key) => key.toLowerCase() === 'idempotency-key');
  }
  return false;
};

const isStreamBody = (body: unknown): boolean => {
  return body instanceof ReadableStream;
};

export const fetchWithResilience = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: ResilienceOptions = {},
): Promise<Response> => {
  const timeout = options.timeout ?? env.PROXY_TIMEOUT_MS;
  const retries = options.retries ?? env.PROXY_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? env.PROXY_RETRY_DELAY_MS;
  const breaker = options.breaker;
  const allowRetry = isIdempotent(init) && !isStreamBody(init.body);

  const attempt = async (): Promise<Response> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        const delay = retryDelayMs * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        return await fetchWithTimeout(input, init, timeout);
      } catch (err) {
        const lastAttempt = attempt === retries;
        if (!lastAttempt && allowRetry && isRetryableError(err)) {
          continue;
        }
        throw err;
      }
    }

    throw new Error('Unexpected end of resilience loop');
  };

  if (breaker) {
    return breaker.call(attempt);
  }
  return attempt();
};
