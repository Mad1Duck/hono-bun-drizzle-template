import { z } from 'zod';

const envSchema = z.object({
  RBAC_SERVICE_PORT: z.coerce.number().default(3005),
  JWT_SECRET: z.string().default('default'),
});

export const env = envSchema.parse(process.env);
