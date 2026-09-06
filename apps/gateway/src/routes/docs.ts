import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { getMergedSpec } from '../lib/openapi';

const app = new Hono()
  .get('/', async (c) => c.json(await getMergedSpec()))
  .get('/ui', swaggerUI({ url: '/v1/docs' }));

export default app;
