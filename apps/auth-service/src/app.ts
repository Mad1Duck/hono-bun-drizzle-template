import { Hono, Context } from 'hono';
import { readFile, stat } from 'node:fs/promises';
import { errorHandler, API_VERSION, requestId, requestLogger } from '@repo/shared';
import { extname, join } from 'path';
import health from './routes/health';
import routes from './routes';
import { websocket, wsHandler } from './websocket';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

const getContentType = (filePath: string) =>
  MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';

const createStaticHandler = (rootPath: string, prefix: string) => async (c: Context) => {
  const raw = c.req.path.replace(prefix, '');
  const relative = decodeURIComponent(raw);

  if (!relative || relative.split(/[\\/]/).some((s) => s === '..')) {
    return new Response('Forbidden', { status: 403 });
  }

  const filePath = join(rootPath, relative);

  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      return new Response('Not found', { status: 404 });
    }

    const data = await readFile(filePath);
    return new Response(data, {
      status: 200,
      headers: { 'Content-Type': getContentType(filePath) },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};

const app = new Hono()
  .use(requestId)
  .use(requestLogger)
  .use('/public/*', createStaticHandler(join(process.cwd(), 'public'), '/public/'))
  .use('/file-data/*', createStaticHandler(join(process.cwd(), 'public'), '/file-data/'))
  .route('/health', health)
  .get(`/${API_VERSION}/ws/:topic`, wsHandler)
  .route(`/${API_VERSION}`, routes)
  .onError(errorHandler);

export { app, websocket };
export type AppType = typeof app;
