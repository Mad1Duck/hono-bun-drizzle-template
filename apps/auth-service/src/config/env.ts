import { z } from 'zod';

const envSchema = z.object({
  AUTH_SERVICE_PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().default('default'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  UPLOADTHING_SECRET: z.string().default(''),
});

export const env = envSchema.parse(process.env);
