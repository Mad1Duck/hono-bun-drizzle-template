import { Hono } from 'hono';
import { getMetrics } from '../lib/metrics';

const app = new Hono().get('/', async (c) => {
  const metrics = await getMetrics();
  return c.text(metrics, 200, {
    'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
  });
});

export default app;
