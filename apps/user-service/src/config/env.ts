import { z } from 'zod';

const envSchema = z.object({
  USER_SERVICE_PORT: z.coerce.number().default(3002),
  JWT_SECRET: z.string().default('default'),
});

export const env = envSchema.parse(process.env);
