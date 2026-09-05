import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  PROXY_TIMEOUT_MS: z.coerce.number().default(5000),
  PROXY_RETRIES: z.coerce.number().default(2),
  PROXY_RETRY_DELAY_MS: z.coerce.number().default(500),
  PROXY_CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(5),
  PROXY_CIRCUIT_BREAKER_RESET_MS: z.coerce.number().default(30000),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  STORAGE_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  RBAC_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  SERVICE_DISCOVERY_SUFFIX: z.string().default(''),
});

export const env = envSchema.parse(process.env);
