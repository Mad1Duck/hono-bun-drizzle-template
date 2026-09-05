import { Hono } from 'hono';
import { isServiceHealthy } from '../lib/http-client';
import { services } from '../config/services';

const app = new Hono()
    .get('/', (c) => c.json({ status: 'ok' }))
    .get('/live', (c) => c.json({ status: 'ok' }))
    .get('/ready', async (c) => {
      const [authOk, notificationOk, userOk] = await Promise.all([
        isServiceHealthy(services.AUTH_SERVICE),
        isServiceHealthy(services.NOTIFICATION_SERVICE),
        isServiceHealthy(services.USER_SERVICE),
      ]);

      const ready = authOk && notificationOk && userOk;

      return c.json({
        status: ready ? 'ok' : 'degraded',
        services: { auth: authOk, notification: notificationOk, user: userOk },
      }, ready ? 200 : 503);
    });

export default app;
