import { Hono } from 'hono';
import { rbacProxy } from '../proxy/rbac.proxy';
import { authentication } from '../middleware/auth';

const app = new Hono()
    .use('/*', authentication)
    .all('/*', rbacProxy);

export default app;
