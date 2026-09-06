import { describe, it, expect } from "vitest";
import { Redis } from "ioredis";
import { RedisEventHub } from "../connector";

const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;

(redisUrl ? describe : describe.skip)("RedisEventHub integration", () => {
  it("broadcast from one hub is received by another", async () => {
    const hubA = new RedisEventHub();
    const hubB = new RedisEventHub();

    const received: { topic: string; payload: unknown }[] = [];
    hubB.subscribe((topic, payload) => {
      received.push({ topic, payload });
    });

    // Wait for psubscribe to be active
    await new Promise((resolve) => setTimeout(resolve, 100));

    hubA.broadcast("USER_ACTIVITY", { id: "u1" });

    // Wait for Redis pub/sub to propagate
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(received.length).toBe(1);
    expect(received[0].topic).toBe("USER_ACTIVITY");
    expect((received[0].payload as any).id).toBe("u1");

    // Clean up
    const pA = (hubA as any).publisher as Redis;
    const sA = (hubA as any).subscriber as Redis;
    const sB = (hubB as any).subscriber as Redis;
    await pA.quit();
    await sA.quit();
    await sB.quit();
  });
});
