import { Hono } from 'hono';
import { logger } from 'hono/logger';
import health from './routes/health';

const app = new Hono()
  .use(logger())
  .route('/health', health);

export { app };
export type AppType = typeof app;
