import { Hono } from 'hono';
import { checkDbHealth } from '@repo/database';

const app = new Hono()
  .get('/', (c) => c.json({ status: 'ok' }))
  .get('/ready', async (c) => {
    const db = await checkDbHealth();
    return c.json({ status: db ? 'ok' : 'degraded', db }, db ? 200 : 503);
  });

export default app;
