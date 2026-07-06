import { Hono } from 'hono';

import auth from '@/modules/auth/route/auth.route';
import storage from '@/modules/storage/route/storage.route';
import { rolesRoute, permissionsRoute } from '@/modules/access/route/access.route';
import health from './health';
import docs from '@/docs/route';

const app = new Hono()
    .route('/auth', auth)
    .route('/storage', storage)
    .route('/roles', rolesRoute)
    .route('/permissions', permissionsRoute)
    .route('/health', health)
    .route('/', docs);

export default app;
