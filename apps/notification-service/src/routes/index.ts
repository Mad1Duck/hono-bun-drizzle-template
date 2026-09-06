import { Hono } from 'hono';

import notifications from '@/modules/notification/route/notification.route';
import health from './health';
import notificationSpec from '../docs';

const app = new Hono()
    .route('/notifications', notifications)
    .route('/health', health)
    .get('/docs', (c) => c.json(notificationSpec));

export default app;
