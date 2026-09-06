import { app } from './app';
import { pool } from '@repo/database';
import { env } from './config/env';
import { closeLogger, logger } from '@repo/logger';
import { createServer, getEventBroker, registerGracefulShutdown } from '@repo/shared';

const eventBroker = getEventBroker();

const port = env.RBAC_SERVICE_PORT;

const server = createServer({
  port,
  fetch: app.fetch,
});

logger.info(`rbac-service listening on http://localhost:${port}`);

registerGracefulShutdown(
  [
    { name: 'http-server', close: () => server.stop(true) },
    { name: 'database', close: () => pool.end() },
    { name: 'event-broker', close: () => eventBroker.close() },
    { name: 'logger', close: closeLogger },
  ],
  { logger },
);
