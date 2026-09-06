import { z } from '@repo/shared';

const envSchema = z.object({
  STORAGE_SERVICE_PORT: z.coerce.number().default(3003),
  UPLOADTHING_SECRET: z.string().default(''),
});

export const env = envSchema.parse(process.env);
