import { Queue } from 'bullmq';
import { redisConfig } from '@repo/config';

export const emailQueue = new Queue('email-queue', {
  connection: redisConfig,
});

export const addEmailJob = (type: string, to: string, data: Record<string, any>) => {
  emailQueue.add(type, { to, ...data });
};
