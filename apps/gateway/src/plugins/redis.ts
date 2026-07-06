import { Redis } from 'ioredis';
import { redisConfig } from '@repo/config';
import { logger } from '@repo/logger';

const MAX_RECONNECT_ATTEMPTS = 5;

// punya koneksi sendiri (dikelola @repo/shared), jangan share instance ini.
export const redis = new Redis({
  ...redisConfig,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy: (times) => (times > MAX_RECONNECT_ATTEMPTS ? null : 2000),
});

redis.on('error', (err) => logger.warn({ err }, 'Redis connection error (gateway plugin)'));
