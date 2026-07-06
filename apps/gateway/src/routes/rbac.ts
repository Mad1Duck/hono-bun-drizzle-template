import { Hono } from 'hono';
import { authProxy } from '../proxy/auth.proxy';
import { authentication } from '../middleware/auth';

// Role & permission management tinggal di auth-service. Router ini dipakai untuk
const app = new Hono()
    .use('/*', authentication)
    .all('/*', authProxy);

export default app;
