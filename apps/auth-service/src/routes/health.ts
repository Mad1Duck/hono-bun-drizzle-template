import { Hono } from 'hono';
import { checkDbHealth } from '@repo/database';
import { checkRedisHealth } from '@repo/shared';

const app = new Hono()
    .get('/', (c) => c.json({ status: 'ok' }))
    .get('/ready', async (c) => {
      const [db, redis] = await Promise.all([checkDbHealth(), checkRedisHealth()]);
      const ok = db && redis;
      return c.json({ status: ok ? 'ok' : 'degraded', db, redis }, ok ? 200 : 503);
    });

export default app;
