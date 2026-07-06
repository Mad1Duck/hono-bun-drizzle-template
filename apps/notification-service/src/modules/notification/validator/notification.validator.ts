import { z } from 'zod';

export const createNotificationSchema = z.object({
  senderId: z.string().uuid().optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  recipientIds: z.array(z.string().uuid()).min(1),
});

export type createNotificationSchemaType = z.infer<typeof createNotificationSchema>;
