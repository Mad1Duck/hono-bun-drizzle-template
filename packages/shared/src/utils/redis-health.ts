import { Redis } from 'ioredis';
import { redisConfig } from '@repo/config';
import { logger } from '@repo/logger';

export const checkRedisHealth = async (timeoutMs = 1000): Promise<boolean> => {
  const redis = new Redis({
    ...redisConfig,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    connectTimeout: timeoutMs,
  });

  try {
    const ping = redis.ping();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Redis health check timeout')), timeoutMs),
    );
    await Promise.race([ping, timeout]);
    return true;
  } catch (err) {
    logger.debug({ err }, 'Redis health check failed');
    return false;
  } finally {
    redis.disconnect();
  }
};
