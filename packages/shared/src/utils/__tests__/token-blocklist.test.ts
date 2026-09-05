import { describe, it, expect } from "bun:test";
import ApiError from "../../apiError";
import { getRevokedAt, revokeUserTokens } from "../token-blocklist";

type MockClient = {
  store: Map<string, string>;
  get: (key: string) => Promise<string | null>;
  setex: (key: string, _ttl: number, value: string | number) => Promise<string>;
};

const createClient = (getError?: Error, setexError?: Error): MockClient => {
  const store = new Map<string, string>();
  return {
    store,
    get: async (key: string) => {
      if (getError) throw getError;
      return store.get(key) ?? null;
    },
    setex: async (key: string, _ttl: number, value: string | number) => {
      if (setexError) throw setexError;
      store.set(key, String(value));
      return "OK";
    },
  };
};

describe("token blocklist", () => {
  it("returns null when user has not been revoked", async () => {
    const client = createClient();
    const result = await getRevokedAt("user-1", client as any);
    expect(result).toBeNull();
  });

  it("returns the revocation timestamp after revokeUserTokens", async () => {
    const client = createClient();
    await revokeUserTokens("user-2", client as any);
    const result = await getRevokedAt("user-2", client as any);
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });

  it("throws ApiError SERVICE_UNAVAILABLE when Redis get fails", async () => {
    const client = createClient(new Error("redis connection closed"));
    try {
      await getRevokedAt("user-3", client as any);
      throw new Error("expected getRevokedAt to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("SERVICE_UNAVAILABLE");
      expect((err as ApiError).statusCode).toBe(503);
    }
  });

  it("does not throw when revokeUserTokens setex fails", async () => {
    const client = createClient(undefined, new Error("redis down"));
    await expect(revokeUserTokens("user-4", client as any)).resolves.toBeUndefined();
  });
});
