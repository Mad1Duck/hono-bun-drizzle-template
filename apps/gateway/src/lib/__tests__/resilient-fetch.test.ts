import { describe, it, expect } from "vitest";

type FetchMock = typeof globalThis.fetch;

process.env.JWT_SECRET = "test-secret";

const { fetchWithResilience, CircuitBreaker, CircuitOpenError } = await import("../fetch");

const okResponse = () => new Response("ok", { status: 200 });

const resilienceOptions = {
  timeout: 100,
  retries: 2,
  retryDelayMs: 10,
};

describe("fetchWithResilience", () => {
  it("returns response on success", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => okResponse()) as unknown as FetchMock;
    try {
      const res = await fetchWithResilience("http://localhost/test", {}, resilienceOptions);
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("retries on network error then succeeds", async () => {
    const original = globalThis.fetch;
    let attempts = 0;
    globalThis.fetch = (async () => {
      attempts++;
      if (attempts === 1) throw new TypeError("fetch failed");
      return okResponse();
    }) as unknown as FetchMock;
    try {
      const res = await fetchWithResilience("http://localhost/test", {}, resilienceOptions);
      expect(res.status).toBe(200);
      expect(attempts).toBe(2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("throws after exhausting retries", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as FetchMock;
    try {
      await expect(fetchWithResilience("http://localhost/test", {}, resilienceOptions)).rejects.toThrow("fetch failed");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("opens circuit breaker after threshold failures", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as FetchMock;

    const breaker = new CircuitBreaker(2, 1000);
    try {
      await expect(fetchWithResilience("http://localhost/test", {}, { ...resilienceOptions, breaker })).rejects.toThrow();
      await expect(fetchWithResilience("http://localhost/test", {}, { ...resilienceOptions, breaker })).rejects.toThrow();
      await expect(fetchWithResilience("http://localhost/test", {}, { ...resilienceOptions, breaker })).rejects.toThrow(CircuitOpenError);
    } finally {
      globalThis.fetch = original;
    }
  });
});
