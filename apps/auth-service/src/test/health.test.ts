import { describe, it, expect } from "vitest";
import app from "../routes/health";

describe("health", () => {
  it("GET / returns ok", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
