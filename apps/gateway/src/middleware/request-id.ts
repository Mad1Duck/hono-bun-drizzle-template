import { createMiddleware } from 'hono/factory';
import { generateTraceId } from '../utils/trace';
import { REQUEST_ID_HEADER, TRACE_ID_HEADER, SPAN_ID_HEADER } from '../config/constants';
import type { Variables } from '../types/hono';

export const requestId = createMiddleware<{ Variables: Variables; }>(async (c, next) => {
  const requestId = c.req.header(REQUEST_ID_HEADER) || generateTraceId();
  const traceId = c.req.header(TRACE_ID_HEADER) || requestId;
  const spanId = generateTraceId();

  c.set('requestId', requestId);
  c.set('traceId', traceId);
  c.set('spanId', spanId);

  c.header(REQUEST_ID_HEADER, requestId);
  c.header(TRACE_ID_HEADER, traceId);
  c.header(SPAN_ID_HEADER, spanId);

  await next();
});
