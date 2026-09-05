import { app } from './app';
import { logger } from '@repo/logger';

const port = process.env.STORAGE_SERVICE_PORT ? Number(process.env.STORAGE_SERVICE_PORT) : 3003;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`storage-service listening on http://localhost:${server.port}`);

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down storage-service gracefully`);
  server.stop();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
