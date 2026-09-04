import { describe, it, expect, mock } from "bun:test";

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

mock.module("../service/auth.service", () => ({
  getUser: async () => ({
    id: "user-1",
    email: "user@example.com",
    firstName: "User",
    lastName: "One",
    username: "user1",
    phone: "628123456789",
    passwordHash: "hashed",
    roles: "USER",
  }),
  createUser: async () => ({
    id: "user-1",
    email: "new@example.com",
    firstName: "New",
    lastName: "User",
    username: "newuser",
    phone: "628123456789",
  }),
  saveRefreshToken: async () => ({}),
  rotateRefreshToken: async () => ({}),
  revokeRefreshToken: async () => ({}),
}));

mock.module("../../../utils/jwt", () => ({
  generateToken: async () => "access-token",
  generateRefreshToken: async () => ({ token: "refresh-token", tmpExp: 1234567890 }),
  verifyToken: async (token: string) => token ? ({ id: "user-1", email: "user@example.com", roles: "USER" }) : null,
  decodeToken: async () => ({}),
}));

mock.module("../../../utils/hashing", () => ({
  bcryptHash: async () => "hashed",
  bcryptVerify: async () => true,
  sha256Hash: (value: string) => value,
}));

const { default: app } = await import("../route/auth.route");

describe("auth routes success", () => {
  it("POST /login returns tokens", async () => {
    const res = await app.request("/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "user1", password: "Password1!" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(body.data.authorization.token).toBe("access-token");
  });

  it("POST /register returns user", async () => {
    const res = await app.request("/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "new@example.com",
        firstName: "New",
        lastName: "User",
        username: "newuser",
        password: "Password1!",
        phone: "08123456789",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("POST /refresh returns tokens", async () => {
    const res = await app.request("/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: "valid-refresh-token" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(body.data.token).toBe("access-token");
  });

  it("POST /logout succeeds", async () => {
    const res = await app.request("/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: "valid-refresh-token" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });
});
