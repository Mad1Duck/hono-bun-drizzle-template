import { app } from './app';
import { closeLogger, logger } from '@repo/logger';
import { registerGracefulShutdown } from '@repo/shared';

const port = process.env.STORAGE_SERVICE_PORT ? Number(process.env.STORAGE_SERVICE_PORT) : 3003;

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

logger.info(`storage-service listening on http://localhost:${server.port}`);

registerGracefulShutdown(
  [
    { name: 'http-server', close: () => server.stop(true) },
    { name: 'logger', close: closeLogger },
  ],
  { logger },
);
