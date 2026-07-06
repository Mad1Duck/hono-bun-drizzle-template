import { Hono } from 'hono';

// owners
import auth from '@/modules/auth/route/auth.route';
import storage from '@/modules/storage/route/storage.route';

const app = new Hono()
    // owners
    .route('/auth', auth)
    .route('/storage', storage);

export default app;
