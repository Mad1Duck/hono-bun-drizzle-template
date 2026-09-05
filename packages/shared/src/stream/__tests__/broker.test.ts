import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { InMemoryEventBroker, RedpandaEventBroker, type EventBroker } from '../broker';
import { USER_ROLE_CHANGED } from '../../constants/topics';
import { getTopicConfig, getPartitionKey } from '../topicRegistry';

const sentMessages: { topic: string; messages: { key?: string; value: string }[] }[] = [];
const consumerRunHandlers: { eachMessage: (payload: { topic: string; partition: number; message: { value: Buffer | null } }) => Promise<void> }[] = [];
const subscribedTopics: string[] = [];
const adminCreatedTopics: unknown[] = [];

const mockProducer = {
  connect: mock(() => Promise.resolve()),
  send: mock((record) => {
    sentMessages.push(record);
    return Promise.resolve([{ topicName: record.topic, partition: 0, errorCode: 0, offset: '0', timestamp: Date.now().toString() }]);
  }),
  disconnect: mock(() => Promise.resolve()),
};

const mockConsumer = {
  connect: mock(() => Promise.resolve()),
  subscribe: mock((opts: { topics: string[] }) => {
    subscribedTopics.push(...opts.topics);
    return Promise.resolve();
  }),
  run: mock((cfg: { eachMessage: (payload: unknown) => Promise<void> }) => {
    consumerRunHandlers.push(cfg as any);
    return Promise.resolve();
  }),
  disconnect: mock(() => Promise.resolve()),
};

const mockAdmin = {
  connect: mock(() => Promise.resolve()),
  createTopics: mock((opts) => {
    adminCreatedTopics.push(opts);
    return Promise.resolve(true);
  }),
  disconnect: mock(() => Promise.resolve()),
};

const mockKafka = {
  producer: () => mockProducer,
  consumer: () => mockConsumer,
  admin: () => mockAdmin,
};

mock.module('kafkajs', () => ({
  Kafka: class {
    config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
    producer() {
      return mockProducer;
    }
    consumer() {
      return mockConsumer;
    }
    admin() {
      return mockAdmin;
    }
  },
  logLevel: {
    NOTHING: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
  } as const,
}));

beforeEach(() => {
  sentMessages.length = 0;
  consumerRunHandlers.length = 0;
  subscribedTopics.length = 0;
  adminCreatedTopics.length = 0;
});

describe('InMemoryEventBroker', () => {
  it('delivers published events to subscribers', async () => {
    const broker = new InMemoryEventBroker();
    const received: unknown[] = [];
    broker.subscribe((topic, payload) => { received.push({ topic, payload }); });

    await broker.publish('TEST_TOPIC', { id: 1 });
    expect(received.length).toBe(1);
    expect((received[0] as any).topic).toBe('TEST_TOPIC');
    expect((received[0] as any).payload.id).toBe(1);
    await broker.close();
  });

  it('supports multiple subscribers and unsubscribe', async () => {
    const broker = new InMemoryEventBroker();
    const received: number[] = [];
    const unsubscribe = broker.subscribe(() => { received.push(1); });
    broker.subscribe(() => { received.push(2); });

    await broker.publish('TEST_TOPIC', {});
    expect(received).toEqual([1, 2]);

    unsubscribe();
    received.length = 0;
    await broker.publish('TEST_TOPIC', {});
    expect(received).toEqual([2]);
    await broker.close();
  });
});

describe('RedpandaEventBroker', () => {
  it('creates topics on first publish and sends a message with partition key', async () => {
    const broker = new RedpandaEventBroker({
      brokers: ['localhost:19092'],
      clientId: 'test',
      groupId: 'test',
    });

    const payload = { payload: { userId: 'user-1' } };
    await broker.publish(USER_ROLE_CHANGED, payload);

    expect(adminCreatedTopics.length).toBe(1);
    expect(subscribedTopics.length).toBe(0);
    expect(sentMessages.length).toBe(1);
    expect(sentMessages[0].topic).toBe(USER_ROLE_CHANGED);
    expect(sentMessages[0].messages[0].key).toBe('user-1');
    expect(JSON.parse(sentMessages[0].messages[0].value)).toEqual(payload);

    await broker.close();
  });

  it('subscribes to all registered topics and delivers messages to handlers', async () => {
    const broker = new RedpandaEventBroker({
      brokers: ['localhost:19092'],
      clientId: 'test',
      groupId: 'test',
    });

    const received: unknown[] = [];
    broker.subscribe((topic, payload) => { received.push({ topic, payload }); });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(subscribedTopics).toContain(USER_ROLE_CHANGED);
    expect(consumerRunHandlers.length).toBe(1);

    const value = JSON.stringify({ payload: { userId: 'user-2', newRoleId: 3 } });
    await consumerRunHandlers[0].eachMessage({
      topic: USER_ROLE_CHANGED,
      partition: 0,
      message: { value: Buffer.from(value) } as any,
    });

    expect(received.length).toBe(1);
    expect((received[0] as any).topic).toBe(USER_ROLE_CHANGED);
    expect((received[0] as any).payload.payload.newRoleId).toBe(3);

    await broker.close();
  });

  it('closes producer and consumer on close', async () => {
    const broker = new RedpandaEventBroker({
      brokers: ['localhost:19092'],
      clientId: 'test',
      groupId: 'test',
    });

    broker.subscribe(() => {});
    await new Promise((resolve) => setTimeout(resolve, 10));

    await broker.close();
    expect(mockProducer.disconnect).toHaveBeenCalled();
    expect(mockConsumer.disconnect).toHaveBeenCalled();
  });
});

describe('Topic registry', () => {
  it('returns default config for registered topics', () => {
    const config = getTopicConfig(USER_ROLE_CHANGED);
    expect(config).toBeDefined();
    expect(config?.partitions).toBe(6);
    expect(config?.replicationFactor).toBe(1);
    expect(config?.cleanupPolicy).toBe('delete');
  });

  it('extracts partition key from nested payload', () => {
    const payload = { payload: { userId: 'u-123' } };
    expect(getPartitionKey(USER_ROLE_CHANGED, payload)).toBe('u-123');
  });
});
