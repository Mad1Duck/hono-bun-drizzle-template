import { createMiddleware } from 'hono/factory';

export const REQUEST_ID_HEADER = 'X-Request-Id';
export const TRACE_ID_HEADER = 'X-Trace-Id';
export const SPAN_ID_HEADER = 'X-Span-Id';

const generateId = () => crypto.randomUUID();

export const requestId = createMiddleware(async (c, next) => {
  const requestId = c.req.header(REQUEST_ID_HEADER) || generateId();
  const traceId = c.req.header(TRACE_ID_HEADER) || requestId;
  const spanId = generateId();

  c.set('requestId', requestId);
  c.set('traceId', traceId);
  c.set('spanId', spanId);

  c.header(REQUEST_ID_HEADER, requestId);
  c.header(TRACE_ID_HEADER, traceId);
  c.header(SPAN_ID_HEADER, spanId);

  await next();
});
