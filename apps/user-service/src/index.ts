import { app } from './app';
import { pool } from '@repo/database';
import { env } from './config/env';
import { closeLogger, logger } from '@repo/logger';
import { createServer, registerGracefulShutdown } from '@repo/shared';
import { startUserRoleChangedConsumer } from './events/user-role-changed.consumer';

const stopUserRoleChangedConsumer = startUserRoleChangedConsumer();

const port = env.USER_SERVICE_PORT;

const server = createServer({
  port,
  fetch: app.fetch,
});

logger.info(`user-service listening on http://localhost:${port}`);

registerGracefulShutdown(
  [
    { name: 'http-server', close: () => server.stop(true) },
    { name: 'user-role-consumer', close: stopUserRoleChangedConsumer },
    { name: 'database', close: () => pool.end() },
    { name: 'logger', close: closeLogger },
  ],
  { logger },
);
