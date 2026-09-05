import { app } from './app';
import { env } from './config/env';
import { closeLogger, logger } from '@repo/logger';
import { registerGracefulShutdown } from '@repo/shared';
import { websocket } from './stream/connector/ws.connector';

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  websocket,
});

logger.info(`gateway listening on http://localhost:${env.PORT}`);

registerGracefulShutdown(
  [
    { name: 'http-server', close: () => server.stop(true) },
    { name: 'logger', close: closeLogger },
  ],
  { logger },
);
