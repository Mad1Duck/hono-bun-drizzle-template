import { describe, it, expect, mock, beforeEach } from "bun:test";

const store = new Map<string, string>();

class Pipeline {
  private commands: any[] = [];

  set(key: string, value: string | number) {
    this.commands.push(["set", key, String(value)]);
    return this;
  }

  setex(key: string, _ttl: number, value: string | number) {
    this.commands.push(["set", key, String(value)]);
    return this;
  }

  expire(_key: string, _ttl: number) {
    return this;
  }

  async exec() {
    for (const cmd of this.commands) {
      if (cmd[0] === "set") {
        store.set(cmd[1], cmd[2]);
      }
    }
    this.commands = [];
    return [];
  }
}

mock.module("ioredis", () => ({
  Redis: class MockRedis {
    on() {
      return this;
    }
    async mget(...keys: string[]) {
      return keys.map((k) => store.get(k) ?? null);
    }
    async del(...keys: string[]) {
      keys.forEach((k) => store.delete(k));
      return keys.length;
    }
    pipeline() {
      return new Pipeline();
    }
  },
}));

process.env.JWT_SECRET = "test-secret";

const { DistributedCircuitBreaker, CircuitOpenError } = await import("../fetch");

describe("DistributedCircuitBreaker", () => {
  beforeEach(() => {
    store.clear();
  });

  it("records failures and opens after threshold", async () => {
    const breaker = new DistributedCircuitBreaker("http://example:3001", 2, 60_000);

    // first and second calls throw the downstream error; the second opens the circuit
    await expect(
      breaker.call(async () => {
        throw new TypeError("down");
      })
    ).rejects.toThrow(TypeError);

    await expect(
      breaker.call(async () => {
        throw new TypeError("down");
      })
    ).rejects.toThrow(TypeError);

    await expect(
      breaker.call(async () => {
        throw new TypeError("down");
      })
    ).rejects.toThrow(CircuitOpenError);
  });

  it("stays closed while below threshold", async () => {
    const breaker = new DistributedCircuitBreaker("http://example:3001", 3, 60_000);

    await expect(
      breaker.call(async () => {
        throw new TypeError("down");
      })
    ).rejects.toThrow(TypeError);

    await expect(
      breaker.call(async () => {
        return "ok";
      })
    ).resolves.toBe("ok");
  });

  it("resets state after a successful call", async () => {
    const breaker = new DistributedCircuitBreaker("http://example:3001", 2, 60_000);

    await expect(
      breaker.call(async () => {
        throw new TypeError("down");
      })
    ).rejects.toThrow(TypeError);

    await expect(
      breaker.call(async () => "ok")
    ).resolves.toBe("ok");

    await expect(
      breaker.call(async () => "still-ok")
    ).resolves.toBe("still-ok");
  });

  it("allows a probe after the reset timeout passes", async () => {
    const breaker = new DistributedCircuitBreaker("http://example:3001", 1, 1);

    await expect(
      breaker.call(async () => {
        throw new TypeError("down");
      })
    ).rejects.toThrow(TypeError);

    // wait for the 1ms reset window to pass
    await new Promise((resolve) => setTimeout(resolve, 10));

    await expect(
      breaker.call(async () => "ok")
    ).resolves.toBe("ok");
  });
});
