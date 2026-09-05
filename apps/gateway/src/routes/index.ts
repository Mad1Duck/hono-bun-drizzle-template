import { Hono } from 'hono';
import auth from './auth';
import notifications from './notifications';
import users from './users';
import upload from './upload';
import rbac from './rbac';
import health from './health';

const app = new Hono()
    .route('/auth', auth)
    .route('/notifications', notifications)
    .route('/users', users)
    .route('/upload', upload)
    .route('/roles', rbac)
    .route('/permissions', rbac)
    .route('/health', health);

export default app;
