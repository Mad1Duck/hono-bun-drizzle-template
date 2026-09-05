import { Redis } from 'ioredis';
import { redisConfig } from '@repo/config';
import { logger } from '@repo/logger';
import ApiError from '../apiError';

const REVOKE_PREFIX = 'token-revoked:';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 8; // 8 hari, lebih panjang dari refresh token

let _redis: Redis | undefined;

const getRedis = (): Redis => {
  if (!_redis) {
    _redis = new Redis({
      ...redisConfig,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: false,
    });
    _redis.on('error', (err) => logger.debug({ err }, 'Redis connection error (token blocklist)'));
  }
  return _redis;
};

type TokenRevocationClient = Pick<Redis, 'get' | 'setex'>;

export const getRevokedAt = async (
  userId: string,
  client: TokenRevocationClient = getRedis(),
): Promise<number | null> => {
  try {
    const value = await client.get(`${REVOKE_PREFIX}${userId}`);
    return value ? Number(value) : null;
  } catch (err) {
    logger.error({ err, userId }, 'Failed to read token revoke timestamp; fail-closed');
    throw new ApiError('SERVICE_UNAVAILABLE', {
      message: 'Token revocation check is unavailable. Please try again later.',
      details: err,
    });
  }
};

export const revokeUserTokens = async (
  userId: string,
  client: TokenRevocationClient = getRedis(),
): Promise<void> => {
  const now = Math.floor(Date.now() / 1000);
  try {
    await client.setex(`${REVOKE_PREFIX}${userId}`, DEFAULT_TTL_SECONDS, now);
  } catch (err) {
    logger.warn({ err, userId }, 'Failed to persist token revocation');
  }
};
