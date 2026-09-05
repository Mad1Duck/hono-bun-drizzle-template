import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { redisConfig } from '@repo/config';
import { logger } from '@repo/logger';
import { versionedTopic } from '../types/stream';

export type StreamListener<T = unknown> = (topic: string, payload: T) => void;

export interface EventHub<T = unknown> {
  broadcast: (topic: string, payload: T) => void;
  subscribe: (listener: StreamListener<T>) => () => void;
  close: () => Promise<void>;
}

export class InMemoryEventHub<T = unknown> implements EventHub<T> {
  private listeners = new Set<StreamListener<T>>();

  broadcast(topic: string, payload: T) {
    for (const listener of this.listeners) {
      listener(topic, payload);
    }
  }

  subscribe(listener: StreamListener<T>) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async close() {
    this.listeners.clear();
  }
}

export class RedisEventHub<T = unknown> implements EventHub<T> {
  private listeners = new Set<StreamListener<T>>();
  private publisher: Redis;
  private subscriber: Redis;
  private subscribedPattern: string | null = null;
  private connected = false;
  private instanceId = randomUUID();

  constructor() {
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    // Optimistic: assume ready if ioredis status is ready. Event handlers keep it updated.
    this.connected = this.subscriber.status === 'ready';

    this.subscriber.on('pmessage', (_pattern, _channel, message) => {
      try {
        const { topic, payload, source } = JSON.parse(message);
        // Jangan deliver ulang pesan yang dikirim oleh instance ini sendiri,
        // karena broadcast() sudah memanggil listener lokal.
        if (source && source === this.instanceId) return;
        this.notifyLocal(topic, payload);
      } catch (err) {
        // Invalid message, ignore
      }
    });

    this.subscriber.on('connect', () => {
      this.connected = true;
      this.resubscribeIfNeeded();
    });

    this.publisher.on('connect', () => {
      this.connected = true;
    });

    const markDisconnected = (err?: Error) => {
      if (err) {
        logger.warn({ err }, 'Redis event bus disconnected; falling back to in-memory delivery');
      }
      this.connected = false;
    };

    this.subscriber.on('error', markDisconnected);
    this.publisher.on('error', markDisconnected);
    this.subscriber.on('end', markDisconnected);
    this.publisher.on('end', markDisconnected);
    this.subscriber.on('close', markDisconnected);
    this.publisher.on('close', markDisconnected);
  }

  private notifyLocal(topic: string, payload: T) {
    for (const listener of this.listeners) {
      listener(topic, payload);
    }
  }

  private resubscribeIfNeeded() {
    if (this.connected && this.listeners.size > 0 && !this.subscribedPattern) {
      const pattern = versionedTopic('*');
      this.subscriber.psubscribe(pattern);
      this.subscribedPattern = pattern;
    }
  }

  broadcast(topic: string, payload: T) {
    // Selalu deliver ke listener lokal agar service tetap berfungsi saat Redis down.
    this.notifyLocal(topic, payload);

    if (!this.connected) {
      return;
    }

    const channel = versionedTopic(topic);
    const message = JSON.stringify({ topic, payload, source: this.instanceId });
    this.publisher.publish(channel, message).catch((err) => {
      logger.warn({ err, topic }, 'failed to publish event to Redis');
      this.connected = false;
    });
  }

  subscribe(listener: StreamListener<T>) {
    this.listeners.add(listener);
    // Subscribe ke semua channel v1:* dengan pattern subscribe.
    // NOTE: setiap instance service menerima semua event v1:*. Untuk skala besar,
    // pertimbangkan psubscribe per topik atau ganti ke Redis Streams.
    this.resubscribeIfNeeded();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.subscribedPattern) {
        this.subscriber.punsubscribe(this.subscribedPattern).catch(() => {});
        this.subscribedPattern = null;
      }
    };
  }

  async close() {
    await Promise.all([
      this.publisher.quit().catch(() => {}),
      this.subscriber.quit().catch(() => {}),
    ]);
    this.connected = false;
  }
}

let _hub: EventHub | null = null;

export const getEventHub = (): EventHub => {
  if (!_hub) {
    _hub = process.env.REDIS_EVENT_BUS === 'true'
      ? new RedisEventHub()
      : new InMemoryEventHub();
  }
  return _hub;
};

// Backward-compatible API: object dengan method broadcast/subscribe
export const eventHub: EventHub = {
  broadcast: (topic, payload) => getEventHub().broadcast(topic, payload),
  subscribe: (listener) => getEventHub().subscribe(listener),
  close: () => getEventHub().close(),
};

export const broadcast = (topic: string, payload: unknown) => eventHub.broadcast(topic, payload);
export const subscribe = (listener: StreamListener) => eventHub.subscribe(listener);
export const closeEventHub = () => eventHub.close();
