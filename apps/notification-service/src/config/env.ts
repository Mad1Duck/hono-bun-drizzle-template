import { z } from 'zod';

const envSchema = z.object({
  NOTIFICATION_SERVICE_PORT: z.coerce.number().default(3004),
});

export const env = envSchema.parse(process.env);
