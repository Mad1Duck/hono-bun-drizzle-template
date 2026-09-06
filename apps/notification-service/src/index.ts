import { app } from './app';
import { pool } from '@repo/database';
import { env } from './config/env';
import { closeLogger, logger } from '@repo/logger';
import { createServer, registerGracefulShutdown } from '@repo/shared';

const port = env.NOTIFICATION_SERVICE_PORT;

const server = createServer({
  port,
  fetch: app.fetch,
});

logger.info(`notification-service listening on http://localhost:${port}`);

registerGracefulShutdown(
  [
    { name: 'http-server', close: () => server.stop(true) },
    { name: 'database', close: () => pool.end() },
    { name: 'logger', close: closeLogger },
  ],
  { logger },
);
