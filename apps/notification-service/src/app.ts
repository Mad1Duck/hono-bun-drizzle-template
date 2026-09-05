import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler, API_VERSION } from '@repo/shared';
import health from './routes/health';
import routes from './routes';

const app = new Hono()
  .use(logger())
  .route('/health', health)
  .route(`/${API_VERSION}`, routes)
  .onError(errorHandler);

export { app };
export type AppType = typeof app;
