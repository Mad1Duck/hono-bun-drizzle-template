import { Hono } from 'hono';
import { requestId } from './middleware/request-id';
import { requestLogger } from './middleware/logger';
import { security } from './middleware/security';
import { corsMiddleware } from './middleware/cors';
import { compression } from './middleware/compression';
import { requestTimeout } from './middleware/timeout';
import { rateLimit } from './middleware/rate-limit';
import { API_VERSION } from '@repo/shared';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import routes from './routes';
import stream from './stream/handler';

// Urutan: RequestID -> Logger -> Security -> CORS -> Compression -> Timeout -> Rate Limit -> (JWT per-route) -> Proxy
const app = new Hono()
  .use(requestId)
  .use(requestLogger)
  .use(security)
  .use(corsMiddleware)
  .use(compression)
  .use(requestTimeout)
  .use(rateLimit)
  .route(`/${API_VERSION}`, routes)
  .route('/', stream)
  .notFound(notFound)
  .onError(errorHandler);

export { app };
export type AppType = typeof app;
