import { Hono } from 'hono';

import auth from '@/modules/auth/route/auth.route';
import health from './health';
import authSpec from '../docs';

const app = new Hono()
    .route('/auth', auth)
    .route('/health', health)
    .get('/docs', (c) => c.json(authSpec));

export default app;
