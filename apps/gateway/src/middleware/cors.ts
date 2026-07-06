import { cors } from 'hono/cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['X-Request-Id'],
  maxAge: 600,
  credentials: true,
});
