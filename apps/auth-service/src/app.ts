import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import { errorHandler, API_VERSION } from '@repo/shared';
import { join } from 'path';
import health from './routes/health';
import routes from './routes';
import { websocket, wsHandler } from './websocket';

const app = new Hono()
  .use(logger())
  .use('/public/*', async (c) => {
    const publicPath = join(process.cwd(), 'public');
    const raw = c.req.path.replace('/public/', '');
    const relative = decodeURIComponent(raw);

    if (!relative || relative.split(/[\\/]/).some((s) => s === '..')) {
      return new Response('Forbidden', { status: 403 });
    }

    const filePath = join(publicPath, relative);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 });
    }

    c.header('Content-Type', file.type);
    return new Response(file);
  })
  .use('/file-data/*', serveStatic({
    root: './public',
    rewriteRequestPath: (path) => path.replace('/file-data/', ''),
  }))
  .route('/health', health)
  .get(`/${API_VERSION}/ws/:topic`, wsHandler)
  .route(`/${API_VERSION}`, routes)
  .onError(errorHandler);

export { app, websocket };
export type AppType = typeof app;
