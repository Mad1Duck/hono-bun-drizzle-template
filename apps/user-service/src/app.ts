import { Hono } from 'hono';
import { API_VERSION, requestId, requestLogger } from '@repo/shared';
import health from './routes/health';
import routes from './routes';

const app = new Hono()
  .use(requestId)
  .use(requestLogger)
  .route('/health', health)
  .route(`/${API_VERSION}`, routes);

export { app };
export type AppType = typeof app;
