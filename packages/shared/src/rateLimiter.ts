import { Redis } from 'ioredis';
import { redisConfig } from '@repo/config';
import { logger } from '@repo/logger';

const MAX_RECONNECT_ATTEMPTS = 5;

const redis = new Redis({
  ...redisConfig,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  retryStrategy: (times) => (times > MAX_RECONNECT_ATTEMPTS ? null : 2000),
  lazyConnect: false,
});
redis.on('error', (err) => logger.warn({ err }, 'Redis connection error (rate limiter)'));

interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

// Fail-open: kalau Redis mati/unreachable, request tetap diizinkan (rate limit nonaktif sementara)
export const checkRateLimit = async ({ key, limit, windowSeconds }: RateLimitOptions) => {
  const redisKey = `rate-limit:${key}`;

  try {
    const attempts = await redis.incr(redisKey);

    if (attempts === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    return {
      allowed: attempts <= limit,
      remaining: Math.max(limit - attempts, 0),
    };
  } catch (err) {
    logger.warn({ err, key }, 'Rate limiter unavailable, allowing request through');
    return { allowed: true, remaining: limit };
  }
};

export const resetRateLimit = async (key: string) => {
  try {
    await redis.del(`rate-limit:${key}`);
  } catch (err) {
    logger.warn({ err, key }, 'Failed to reset rate limit counter');
  }
};
