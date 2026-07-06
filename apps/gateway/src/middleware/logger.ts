import { createMiddleware } from 'hono/factory';
import { logger } from '@repo/logger';
import type { Variables } from '../types/hono';

export const requestLogger = createMiddleware<{ Variables: Variables; }>(async (c, next) => {
  const start = Date.now();

  await next();

  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Date.now() - start,
    requestId: c.get('requestId'),
  }, 'request completed');
});
