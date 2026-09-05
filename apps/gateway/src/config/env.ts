import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
});

export const env = envSchema.parse(process.env);
