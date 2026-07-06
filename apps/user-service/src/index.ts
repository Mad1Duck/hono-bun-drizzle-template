import { app } from './app';
import { pool } from '@repo/database';
import { logger } from '@repo/logger';

const port = process.env.USER_SERVICE_PORT || 3002;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`user-service listening on http://localhost:${port}`);

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down user-service gracefully`);
  server.stop();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
