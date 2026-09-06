import { describe, it, expect } from "vitest";
import app from "../route/auth.route";

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
