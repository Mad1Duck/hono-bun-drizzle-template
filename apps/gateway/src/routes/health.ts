import { Hono } from 'hono';
import { isServiceHealthy } from '../lib/http-client';
import { services } from '../config/services';

const app = new Hono()
    .get('/', (c) => c.json({ status: 'ok' }))
    .get('/live', (c) => c.json({ status: 'ok' }))
    .get('/ready', async (c) => {
      const [authOk, notificationOk, userOk, storageOk, rbacOk] = await Promise.all([
        isServiceHealthy(services.AUTH_SERVICE),
        isServiceHealthy(services.NOTIFICATION_SERVICE),
        isServiceHealthy(services.USER_SERVICE),
        isServiceHealthy(services.STORAGE_SERVICE),
        isServiceHealthy(services.RBAC_SERVICE),
      ]);

      const ready = authOk && notificationOk && userOk && storageOk && rbacOk;

      return c.json({
        status: ready ? 'ok' : 'degraded',
        services: { auth: authOk, notification: notificationOk, user: userOk, storage: storageOk, rbac: rbacOk },
      }, ready ? 200 : 503);
    });

export default app;
