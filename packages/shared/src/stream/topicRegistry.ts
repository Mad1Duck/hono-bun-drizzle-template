import { USER_ROLE_CHANGED } from '../constants/topics';

export interface TopicConfig {
  name: string;
  /** Number of partitions for the topic. */
  partitions?: number;
  /** Replication factor. Use 1 for dev, 3 for production. */
  replicationFactor?: number;
  /** Retention in milliseconds. */
  retentionMs?: number;
  /** Cleanup policy. */
  cleanupPolicy?: 'delete' | 'compact';
  /** Extract the Kafka message key from the event payload. */
  partitionKey?: (payload: unknown) => string | undefined;
}

const DEFAULTS: Required<Pick<TopicConfig, 'partitions' | 'replicationFactor' | 'retentionMs' | 'cleanupPolicy'>> = {
  partitions: 6,
  replicationFactor: 1,
  retentionMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  cleanupPolicy: 'delete',
};

const TOPIC_REGISTRY = new Map<string, TopicConfig>();

export const registerTopic = (topic: string, config: TopicConfig): void => {
  TOPIC_REGISTRY.set(topic, {
    ...config,
    name: topic,
  });
};

const applyEnvOverrides = (topic: string, config: TopicConfig): TopicConfig => {
  const envKey = (suffix: string) => `REDPANDA_TOPIC_${topic}_${suffix}`;
  const partitions = process.env[envKey('PARTITIONS')];
  const replicationFactor = process.env[envKey('REPLICATION_FACTOR')];
  const retentionMs = process.env[envKey('RETENTION_MS')];
  const cleanupPolicy = process.env[envKey('CLEANUP_POLICY')] as TopicConfig['cleanupPolicy'] | undefined;

  return {
    ...config,
    partitions: partitions ? Number(partitions) : config.partitions,
    replicationFactor: replicationFactor ? Number(replicationFactor) : config.replicationFactor,
    retentionMs: retentionMs ? Number(retentionMs) : config.retentionMs,
    cleanupPolicy: cleanupPolicy ?? config.cleanupPolicy,
  };
};

export const getTopicConfig = (topic: string): TopicConfig | undefined => {
  const config = TOPIC_REGISTRY.get(topic);
  if (!config) return undefined;

  return applyEnvOverrides(topic, {
    ...DEFAULTS,
    ...config,
  });
};

export const getAllTopicConfigs = (): TopicConfig[] => {
  return Array.from(TOPIC_REGISTRY.values()).map((config) =>
    applyEnvOverrides(config.name, {
      ...DEFAULTS,
      ...config,
    }),
  );
};

export const getRegisteredTopicNames = (): string[] => {
  return Array.from(TOPIC_REGISTRY.keys());
};

export type TopicPartitionKeyFn = (topic: string, payload: unknown) => string | undefined;

export const getPartitionKey: TopicPartitionKeyFn = (topic, payload) => {
  const config = getTopicConfig(topic);
  if (config?.partitionKey) {
    return config.partitionKey(payload);
  }
  // Fallback: look for common id fields in the payload.
  const record = payload as Record<string, unknown> | undefined;
  if (record && typeof record === 'object') {
    return (record.userId as string) ?? (record.id as string) ?? (record.aggregateId as string) ?? undefined;
  }
  return undefined;
};

// Register built-in topics.
registerTopic(USER_ROLE_CHANGED, {
  name: USER_ROLE_CHANGED,
  partitions: 6,
  replicationFactor: 1,
  retentionMs: 7 * 24 * 60 * 60 * 1000,
  cleanupPolicy: 'delete',
  partitionKey: (payload) => {
    const event = payload as { payload?: { userId?: string }; userId?: string } | undefined;
    return event?.payload?.userId ?? event?.userId;
  },
});
