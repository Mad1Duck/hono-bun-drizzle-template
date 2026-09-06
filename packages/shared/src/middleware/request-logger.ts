import { createMiddleware } from 'hono/factory';
import { logger } from '@repo/logger';

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();

  await next();

  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: Date.now() - start,
    requestId: c.get('requestId'),
    traceId: c.get('traceId'),
    spanId: c.get('spanId'),
  }, 'request completed');
});
