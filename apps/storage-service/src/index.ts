import { app } from './app';
import { env } from './config/env';
import { closeLogger, logger } from '@repo/logger';
import { createServer, registerGracefulShutdown } from '@repo/shared';

const port = env.STORAGE_SERVICE_PORT;

const server = createServer({
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
