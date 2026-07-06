import { Context } from 'hono';
import { filterHeaders } from '../utils/headers';
import { REQUEST_ID_HEADER } from '../config/constants';
import type { Variables } from '../types/hono';

export const createProxy = (targetBaseUrl: string) => {
  return async (c: Context<{ Variables: Variables; }>) => {
    const incomingUrl = new URL(c.req.url);
    const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, targetBaseUrl);

    const headers = filterHeaders(c.req.raw.headers);
    const requestId = c.get('requestId');
    if (requestId) headers.set(REQUEST_ID_HEADER, requestId);

    const hasBody = !['GET', 'HEAD'].includes(c.req.method);

    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: hasBody ? c.req.raw.body : undefined,
      // @ts-expect-error -- duplex runtime fetch saat body berupa stream
      duplex: hasBody ? 'half' : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: filterHeaders(response.headers),
    });
  };
};
