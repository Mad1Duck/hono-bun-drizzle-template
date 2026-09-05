import { Hono } from 'hono';

const app = new Hono()
  .get('/', (c) => c.json({ status: 'ok' }));

export default app;
