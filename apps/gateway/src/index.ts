import { app } from './app';
import { env } from './config/env';
import { logger } from '@repo/logger';
import { websocket } from './stream/connector/ws.connector';

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  websocket,
});

logger.info(`gateway listening on http://localhost:${env.PORT}`);

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gateway gracefully`);
  server.stop();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
