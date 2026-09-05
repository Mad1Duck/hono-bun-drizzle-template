import { describe, it, expect, mock, beforeEach } from "bun:test";

type Listener = (pattern: string, channel: string, message: string) => void;

let pmessageListener: Listener | null = null;
const published: { channel: string; message: string }[] = [];
const psubscribed: string[] = [];

mock.module("ioredis", () => ({
  Redis: class MockRedis {
    status = 'ready';
    on(event: string, cb: Listener) {
      if (event === "pmessage") pmessageListener = cb;
      return this;
    }
    psubscribe(pattern: string) {
      psubscribed.push(pattern);
      return Promise.resolve();
    }
    punsubscribe(pattern: string) {
      const idx = psubscribed.indexOf(pattern);
      if (idx !== -1) psubscribed.splice(idx, 1);
      return Promise.resolve();
    }
    publish(channel: string, message: string) {
      published.push({ channel, message });
      return Promise.resolve(1);
    }
  },
}));

beforeEach(() => {
  pmessageListener = null;
  published.length = 0;
  psubscribed.length = 0;
});

describe("RedisEventHub", () => {
  it("publishes broadcast to a versioned channel", async () => {
    const { RedisEventHub } = await import("../connector");
    const hub = new RedisEventHub();
    hub.broadcast("USER_ACTIVITY", { id: "u1" });
    expect(published.length).toBe(1);
    expect(published[0].channel).toBe("v1:USER_ACTIVITY");
    const parsed = JSON.parse(published[0].message);
    expect(parsed.topic).toBe("USER_ACTIVITY");
    expect(parsed.payload.id).toBe("u1");
  });

  it("subscribes to wildcard channel and receives messages", async () => {
    const { RedisEventHub } = await import("../connector");
    const hub = new RedisEventHub();
    const received: unknown[] = [];
    hub.subscribe((topic, payload) => {
      received.push({ topic, payload });
    });
    expect(psubscribed.length).toBe(1);
    expect(psubscribed[0]).toBe("v1:*");

    pmessageListener?.("v1:*", "v1:USER_ACTIVITY", JSON.stringify({
      topic: "USER_ACTIVITY",
      payload: { id: "u1" },
    }));

    expect(received.length).toBe(1);
    expect((received[0] as any).topic).toBe("USER_ACTIVITY");
  });

  it("unsubscribes from wildcard when last listener removed", async () => {
    const { RedisEventHub } = await import("../connector");
    const hub = new RedisEventHub();
    const unsubscribe = hub.subscribe(() => {});
    expect(psubscribed.length).toBe(1);
    unsubscribe();
    expect(psubscribed.length).toBe(0);
  });
});
