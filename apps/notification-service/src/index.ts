import { app } from './app';
import { pool } from '@repo/database';
import { logger } from '@repo/logger';

const port = process.env.NOTIFICATION_SERVICE_PORT || 3004;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`notification-service listening on http://localhost:${port}`);

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down notification-service gracefully`);
  server.stop();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
