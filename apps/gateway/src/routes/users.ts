import { Hono } from 'hono';
import { userProxy } from '../proxy/user.proxy';
import { authentication } from '../middleware/auth';

const app = new Hono()
    .use('/*', authentication)
    .all('/*', userProxy);

export default app;
