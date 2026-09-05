import { Context } from 'hono';
import { filterHeaders } from '../utils/headers';
import { REQUEST_ID_HEADER } from '../config/constants';
import type { Variables } from '../types/hono';
import { env } from '../config/env';
import { fetchWithResilience, CircuitBreaker, DistributedCircuitBreaker, type CircuitBreakerLike } from './fetch';
import { registerCircuitBreaker } from './metrics';
import { failureFromCode } from './response';

const breakers = new Map<string, CircuitBreakerLike>();

const getBreaker = (targetBaseUrl: string): CircuitBreakerLike => {
  if (!breakers.has(targetBaseUrl)) {
    const breaker = env.DISTRIBUTED_CIRCUIT_BREAKER
      ? new DistributedCircuitBreaker(targetBaseUrl)
      : new CircuitBreaker();
    breakers.set(targetBaseUrl, breaker);
    registerCircuitBreaker(targetBaseUrl, breaker);
  }
  return breakers.get(targetBaseUrl)!;
};

export const createProxy = (targetBaseUrl: string) => {
  const breaker = getBreaker(targetBaseUrl);

  return async (c: Context<{ Variables: Variables; }>) => {
    const incomingUrl = new URL(c.req.url);
    const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, targetBaseUrl);

    const headers = filterHeaders(c.req.raw.headers);
    const requestId = c.get('requestId');
    if (requestId) headers.set(REQUEST_ID_HEADER, requestId);

    const hasBody = !['GET', 'HEAD'].includes(c.req.method);

    try {
      const response = await fetchWithResilience(
        targetUrl,
        {
          method: c.req.method,
          headers,
          body: hasBody ? c.req.raw.body : undefined,
          // @ts-expect-error -- duplex runtime fetch saat body berupa stream
          duplex: hasBody ? 'half' : undefined,
        },
        { breaker },
      );

      return new Response(response.body, {
        status: response.status,
        headers: filterHeaders(response.headers),
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'CircuitOpenError') {
        return failureFromCode(c, 'SERVICE_UNAVAILABLE');
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        return failureFromCode(c, 'GATEWAY_TIMEOUT', {
          message: 'Downstream service did not respond in time',
        });
      }

      if (err instanceof TypeError) {
        return failureFromCode(c, 'BAD_GATEWAY', {
          message: 'Downstream service is unreachable',
        });
      }

      return failureFromCode(c, 'INTERNAL_ERROR');
    }
  };
};
