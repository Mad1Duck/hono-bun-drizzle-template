import { Hono } from 'hono';
import auth from './auth';
import notifications from './notifications';
import users from './users';
import rbac from './rbac';
import health from './health';

const app = new Hono()
    .route('/auth', auth)
    .route('/notifications', notifications)
    .route('/users', users)
    .route('/roles', rbac)
    .route('/permissions', rbac)
    .route('/health', health);

export default app;
