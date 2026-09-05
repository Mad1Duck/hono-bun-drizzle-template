import { Worker } from 'bullmq';
import { redisConfig } from '@repo/config';
import { logger } from '@repo/logger';
import { sendEmail } from './service/email.service';

const emailWorker = new Worker('email-queue', async (job) => {
  const { to, ...data } = job.data;

  try {
    await sendEmail(job.name, to, data);
    logger.info({ jobId: job.id, name: job.name, to }, 'email sent');
  } catch (error) {
    logger.error({ jobId: job.id, name: job.name, to, error }, 'email failed');
  }
}, {
  connection: redisConfig,
});

logger.info('email-worker started');

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, closing email-worker gracefully`);
  await emailWorker.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
