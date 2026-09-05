import { app } from './app';
import { pool } from '@repo/database';
import { closeLogger, logger } from '@repo/logger';
import { getEventBroker, registerGracefulShutdown } from '@repo/shared';

const eventBroker = getEventBroker();

const port = process.env.RBAC_SERVICE_PORT ? Number(process.env.RBAC_SERVICE_PORT) : 3005;

const server = Bun.serve({
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
