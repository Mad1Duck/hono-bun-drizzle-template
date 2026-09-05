import { describe, it, expect, mock } from "bun:test";

process.env.JWT_SECRET = "test-secret";
process.env.AUTH_SERVICE_URL = "http://localhost:3001";
process.env.NOTIFICATION_SERVICE_URL = "http://localhost:3004";
process.env.USER_SERVICE_URL = "http://localhost:3002";

mock.module("ioredis", () => ({
  Redis: class MockRedis {
    incr() { return Promise.resolve(1); }
    expire() { return Promise.resolve(1); }
    del() { return Promise.resolve(1); }
    on() { return this; }
    quit() { return Promise.resolve(undefined); }
  },
  default: class MockRedis {
    incr() { return Promise.resolve(1); }
    expire() { return Promise.resolve(1); }
    del() { return Promise.resolve(1); }
    on() { return this; }
    quit() { return Promise.resolve(undefined); }
  },
}));

const { app } = await import("../app");

describe("gateway routes", () => {
  it("GET /v1/health returns ok", async () => {
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("GET /v1/health/live returns ok", async () => {
    const res = await app.request("/v1/health/live");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("GET /v1/health/ready returns ok when downstream is healthy", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(null, { status: 200 })) as any;
    try {
      const res = await app.request("/v1/health/ready");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("GET /v1/health/ready returns degraded when downstream is unhealthy", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(null, { status: 503 })) as any;
    try {
      const res = await app.request("/v1/health/ready");
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.status).toBe("degraded");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("GET /v1/notifications without token returns 401", async () => {
    const res = await app.request("/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("POST /v1/auth/register proxies to auth service", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: any, init: any) => {
      const url = new URL(input as string);
      expect(url.pathname).toBe("/v1/auth/register");
      return new Response(
        JSON.stringify({ data: { id: "user-1" }, error: null, meta: { status: "SUCCESS", code: 201, version: "v1" } }),
        { status: 201, headers: { "content-type": "application/json" } }
      ) as any;
    }) as any;
    try {
      const res = await app.request("/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "u", password: "P@ssw0rd" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.id).toBe("user-1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
