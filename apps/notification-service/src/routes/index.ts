import { Hono } from 'hono';

import notifications from '@/modules/notification/route/notification.route';
import health from './health';

const app = new Hono()
    .route('/notifications', notifications)
    .route('/health', health);

export default app;
