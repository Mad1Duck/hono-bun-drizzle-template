import { app, websocket } from './app';
import { pool } from '@repo/database';
import { env } from './config/env';
import { closeLogger, logger } from '@repo/logger';
import { createServer, registerGracefulShutdown } from '@repo/shared';

const port = env.AUTH_SERVICE_PORT;

const server = createServer({
  port,
  fetch: app.fetch,
  websocket,
});

logger.info(`auth-service listening on http://localhost:${port}`);

registerGracefulShutdown(
  [
    { name: 'http-server', close: () => server.stop(true) },
    { name: 'database', close: () => pool.end() },
    { name: 'logger', close: closeLogger },
  ],
  { logger },
);
