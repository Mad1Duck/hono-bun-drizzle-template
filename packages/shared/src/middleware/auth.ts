import { verify } from 'hono/jwt';
import type { MiddlewareHandler } from 'hono';
import ApiError from '../apiError';
import { getRevokedAt } from '../utils/token-blocklist';

export const createAuthentication = (secret: string): MiddlewareHandler =>
  async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError('INVALID_CREDENTIALS');
    }

    const token = header.slice(7);
    try {
      const payload = (await verify(token, secret, 'HS256')) as Record<string, unknown>;
      const revokedAt = await getRevokedAt(String(payload.id));
      if (revokedAt && typeof payload.iat === 'number' && payload.iat < revokedAt) {
        throw new ApiError('INVALID_CREDENTIALS');
      }
      c.set('jwtPayload', payload);
      await next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('INVALID_CREDENTIALS');
    }
  };
