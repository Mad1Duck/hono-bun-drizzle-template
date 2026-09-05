import { Hono } from 'hono';

import auth from '@/modules/auth/route/auth.route';
import health from './health';

const app = new Hono()
    .route('/auth', auth)
    .route('/health', health);

export default app;
