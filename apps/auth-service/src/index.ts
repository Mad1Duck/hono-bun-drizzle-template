import { app, websocket } from './app';
import { pool } from '@repo/database';
import { logger } from '@repo/logger';

const port = process.env.AUTH_SERVICE_PORT || 3001;

const server = Bun.serve({
  port,
  fetch: app.fetch,
  websocket,
});

logger.info(`auth-service listening on http://localhost:${port}`);

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down auth-service gracefully`);
  server.stop();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
