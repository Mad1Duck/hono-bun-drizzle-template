import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from '@repo/shared';
import routes from './routes';

const app = new Hono()
  .use(logger())
  .route('/', routes)
  .onError(errorHandler);

export { app };
export type AppType = typeof app;
