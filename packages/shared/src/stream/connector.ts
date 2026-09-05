import { Redis } from 'ioredis';
import { redisConfig } from '@repo/config';
import { versionedTopic } from '../types/stream';

export type StreamListener<T = unknown> = (topic: string, payload: T) => void;

export interface EventHub<T = unknown> {
  broadcast: (topic: string, payload: T) => void;
  subscribe: (listener: StreamListener<T>) => () => void;
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
}

export class RedisEventHub<T = unknown> implements EventHub<T> {
  private listeners = new Set<StreamListener<T>>();
  private publisher: Redis;
  private subscriber: Redis;
  private subscribedPattern: string | null = null;

  constructor() {
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.subscriber.on('pmessage', (_pattern, _channel, message) => {
      try {
        const { topic, payload } = JSON.parse(message);
        for (const listener of this.listeners) {
          listener(topic, payload);
        }
      } catch (err) {
        // Invalid message, ignore
      }
    });
  }

  broadcast(topic: string, payload: T) {
    const channel = versionedTopic(topic);
    this.publisher.publish(channel, JSON.stringify({ topic, payload }));
  }

  subscribe(listener: StreamListener<T>) {
    this.listeners.add(listener);
    // Subscribe ke semua channel v1:* dengan pattern subscribe.
    // NOTE: setiap instance service menerima semua event v1:*. Untuk skala besar,
    // pertimbangkan psubscribe per topik atau ganti ke Redis Streams.
    const pattern = versionedTopic('*');
    if (!this.subscribedPattern) {
      this.subscriber.psubscribe(pattern);
      this.subscribedPattern = pattern;
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.subscribedPattern) {
        this.subscriber.punsubscribe(this.subscribedPattern);
        this.subscribedPattern = null;
      }
    };
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
};

export const broadcast = (topic: string, payload: unknown) => eventHub.broadcast(topic, payload);
export const subscribe = (listener: StreamListener) => eventHub.subscribe(listener);
