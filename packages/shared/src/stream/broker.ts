import { Kafka, logLevel, type Producer, type Consumer, type Admin, type EachMessagePayload } from 'kafkajs';
import { logger } from '@repo/logger';
import { getTopicConfig, getAllTopicConfigs, getPartitionKey } from './topicRegistry';
import { InMemoryEventHub, RedisEventHub } from './connector';

export type EventHandler = (topic: string, payload: unknown) => void | Promise<void>;

export interface EventBroker {
  publish<T>(topic: string, payload: T): Promise<void>;
  subscribe(handler: EventHandler): () => void;
  close(): Promise<void>;
}

export interface EventBrokerOptions {
  clientId?: string;
  groupId?: string;
}

export class InMemoryEventBroker implements EventBroker {
  private listeners = new Set<EventHandler>();

  async publish<T>(_topic: string, payload: T) {
    const handlers = Array.from(this.listeners);
    for (const handler of handlers) {
      try {
        await Promise.resolve(handler(_topic, payload as unknown));
      } catch (err) {
        logger.error({ err, topic: _topic }, 'InMemoryEventBroker listener failed');
      }
    }
  }

  subscribe(handler: EventHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  async close() {
    this.listeners.clear();
  }
}

export class RedisEventBroker implements EventBroker {
  private hub: InMemoryEventHub | RedisEventHub;

  constructor() {
    this.hub = process.env.REDIS_EVENT_BUS === 'true'
      ? new RedisEventHub()
      : new InMemoryEventHub();
  }

  async publish<T>(topic: string, payload: T) {
    this.hub.broadcast(topic, payload as unknown);
  }

  subscribe(handler: EventHandler) {
    return this.hub.subscribe((topic, payload) => handler(topic, payload));
  }

  async close() {
    await this.hub.close();
  }
}

type RedpandaBrokerConfig = {
  brokers: string[];
  clientId: string;
  groupId: string;
};

export class RedpandaEventBroker implements EventBroker {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private consumer: Consumer | null = null;
  private handlers = new Set<EventHandler>();
  private connected = false;
  private initialized = false;
  private config: RedpandaBrokerConfig;

  constructor(config: RedpandaBrokerConfig) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });
    this.producer = this.kafka.producer({
      idempotent: true,
      maxInFlightRequests: 1,
      transactionalId: undefined,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });
    this.admin = this.kafka.admin();
  }

  private async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      await this.admin.connect();
      const topics = getAllTopicConfigs().map((config) => ({
        topic: config.name,
        numPartitions: config.partitions,
        replicationFactor: config.replicationFactor,
        configEntries: [
          { name: 'retention.ms', value: String(config.retentionMs) },
          { name: 'cleanup.policy', value: config.cleanupPolicy },
        ] as { name: string; value: string }[],
      }));

      if (topics.length > 0) {
        await this.admin.createTopics({
          topics,
          waitForLeaders: true,
          timeout: 5000,
        }).catch((err) => {
          // Topic may already exist; log and continue.
          logger.debug({ err }, 'Redpanda createTopics returned an error or topic already exists');
        });
      }

      await this.admin.disconnect();
      await this.producer.connect();
      this.connected = true;
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Redpanda broker');
      throw err;
    }
  }

  async publish<T>(topic: string, payload: T) {
    await this.initialize();

    const key = getPartitionKey(topic, payload as unknown);
    const message = {
      key,
      value: JSON.stringify(payload),
    };

    await this.producer.send({
      topic,
      messages: [message],
      acks: -1,
    });
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);

    if (this.consumer) return () => this.handlers.delete(handler);

    // Start the consumer lazily on the first subscription.
    const startConsumer = async () => {
      try {
        const topics = getAllTopicConfigs().map((c) => c.name);
        if (topics.length === 0) {
          logger.warn('No topics registered for Redpanda consumer; subscription is no-op');
          return;
        }

        this.consumer = this.kafka.consumer({
          groupId: this.config.groupId,
          maxWaitTimeInMs: 100,
          retry: {
            initialRetryTime: 300,
            retries: 5,
          },
        });

        await this.consumer.connect();
        await this.consumer.subscribe({ topics, fromBeginning: false });
        await this.consumer.run({
          eachMessage: async (payload: EachMessagePayload) => {
            await this.handleMessage(payload);
          },
        });
      } catch (err) {
        logger.error({ err }, 'Failed to start Redpanda consumer');
        throw err;
      }
    };

    void startConsumer();
    return () => this.handlers.delete(handler);
  }

  private async handleMessage({ topic, message }: EachMessagePayload) {
    if (!message.value) return;

    try {
      const payload = JSON.parse(message.value.toString());
      const handlers = Array.from(this.handlers);
      for (const handler of handlers) {
        try {
          await Promise.resolve(handler(topic, payload));
        } catch (err) {
          logger.error({ err, topic }, 'Redpanda handler failed; consumer will retry');
          throw err;
        }
      }
    } catch (err) {
      // Re-throw so KafkaJS does not commit the offset and the message is retried.
      throw err;
    }
  }

  async close() {
    if (!this.connected && !this.consumer && !this.initialized) {
      return;
    }
    try {
      await this.producer.disconnect().catch(() => {});
      await this.consumer?.disconnect().catch(() => {});
      this.connected = false;
      this.initialized = false;
    } catch (err) {
      logger.error({ err }, 'Error while closing Redpanda broker');
    }
  }
}

const parseBrokers = (): string[] => {
  const raw = process.env.KAFKA_BROKERS;
  if (raw) return raw.split(',').map((b) => b.trim()).filter(Boolean);
  return ['localhost:19092'];
};

const buildBroker = (clientId: string, groupId: string): EventBroker => {
  const provider = process.env.EVENT_BUS_PROVIDER || 'memory';
  switch (provider) {
    case 'redpanda':
      return new RedpandaEventBroker({ brokers: parseBrokers(), clientId, groupId });
    case 'redis':
      return new RedisEventBroker();
    case 'memory':
    default:
      return new InMemoryEventBroker();
  }
};

const brokerInstances = new Map<string, EventBroker>();

export const createEventBroker = (options?: EventBrokerOptions): EventBroker => {
  const clientId = options?.clientId || process.env.KAFKA_CLIENT_ID || process.env.SERVICE_NAME || 'backend';
  const groupId = options?.groupId || process.env.KAFKA_CONSUMER_GROUP_ID || process.env.SERVICE_NAME || 'backend';
  const key = `${clientId}:${groupId}`;

  if (!brokerInstances.has(key)) {
    brokerInstances.set(key, buildBroker(clientId, groupId));
  }
  return brokerInstances.get(key)!;
};

export const getEventBroker = (): EventBroker => createEventBroker();
