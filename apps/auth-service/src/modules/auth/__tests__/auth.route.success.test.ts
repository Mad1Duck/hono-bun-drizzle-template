import { describe, it, expect, vi } from "vitest";

vi.mock("@repo/shared", () => ({
  catchAsync: (fn: any) => async (c: any, next: any) => {
    try {
      return await fn(c, next);
    } catch (error: any) {
      return c.json(
        {
          data: null,
          error: {
            code: error.code || "INTERNAL_ERROR",
            message: error.message || "Internal Server Error",
            fields: error.fields,
            details: error.details,
          },
          meta: {
            code: error.statusCode || 500,
            status: "ERROR",
            version: "v1",
          },
        },
        error.statusCode || 500,
      );
    }
  },
  success: (c: any, data: any, options?: any) =>
    c.json(
      {
        data,
        error: null,
        meta: {
          code: options?.code || 200,
          status: "SUCCESS",
          message: options?.message || "Success",
          version: "v1",
        },
      },
      options?.code || 200,
    ),
  ApiError: class ApiError extends Error {
    statusCode: number;
    code: string;
    fields?: Record<string, string[]>;
    details?: unknown;
    isOperational: boolean;
    constructor(code: string, overrides?: any) {
      super(code);
      this.statusCode = overrides?.statusCode || 400;
      this.code = code;
      this.fields = overrides?.fields;
      this.details = overrides?.details;
      this.isOperational = true;
    }
  },
  checkRateLimit: async () => ({ allowed: true, remaining: 5 }),
  resetRateLimit: async () => {},
}));

vi.mock("../service/auth.service", () => ({
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

vi.mock("../../../utils/jwt", () => ({
  generateToken: async () => "access-token",
  generateRefreshToken: async () => ({ token: "refresh-token", tmpExp: 1234567890 }),
  verifyToken: async (token: string) => token ? ({ id: "user-1", email: "user@example.com", roles: "USER" }) : null,
  decodeToken: async () => ({}),
}));

vi.mock("../../../utils/hashing", () => ({
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
