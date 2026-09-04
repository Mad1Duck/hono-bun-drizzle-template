import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import { errorHandler, API_VERSION } from '@repo/shared';
import { join } from 'path';
import routes from './routes';
import { websocket, wsHandler } from './websocket';

const app = new Hono()
  .use(logger())
  .use('/public/*', async (c) => {
    const publicPath = join(process.cwd(), 'public');
    const filePath = join(publicPath, c.req.path.replace('/public/', ''));
    return new Response(Bun.file(filePath));
  })
  .use('/file-data/*', serveStatic({
    root: './public',
    rewriteRequestPath: (path) => path.replace('/file-data/', ''),
  }))
  .get(`/${API_VERSION}/ws/:topic`, wsHandler)
  .route(`/${API_VERSION}`, routes)
  .onError(errorHandler);

export { app, websocket };
export type AppType = typeof app;
