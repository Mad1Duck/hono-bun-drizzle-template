import { env } from '../config/env';

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is OPEN') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

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

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof CircuitOpenError) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return false;
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
        if (!lastAttempt && isRetryableError(err)) {
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
