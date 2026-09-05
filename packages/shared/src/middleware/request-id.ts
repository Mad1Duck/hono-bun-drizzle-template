import { createMiddleware } from 'hono/factory';

export const REQUEST_ID_HEADER = 'X-Request-Id';

const generateTraceId = () => crypto.randomUUID();

export const requestId = createMiddleware(async (c, next) => {
  const incoming = c.req.header(REQUEST_ID_HEADER);
  const id = incoming || generateTraceId();

  c.set('requestId', id);
  c.header(REQUEST_ID_HEADER, id);

  await next();
});
