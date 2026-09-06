import { describe, it, expect, vi } from "vitest";

vi.mock("ioredis", () => ({
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

const { default: app } = await import("../route/auth.route");

describe("auth routes", () => {
  it("POST /login rejects empty body", async () => {
    const res = await app.request("/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.meta.status).toBe("ERROR");
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /register rejects invalid password", async () => {
    const res = await app.request("/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "a@b.com",
        firstName: "A",
        lastName: "B",
        username: "ab",
        password: "weak",
        phone: "08123456789",
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.meta.status).toBe("ERROR");
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /refresh rejects missing token", async () => {
    const res = await app.request("/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /logout rejects missing token", async () => {
    const res = await app.request("/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
