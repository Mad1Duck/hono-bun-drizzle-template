import { Hono } from 'hono';
import { notificationProxy } from '../proxy/notification.proxy';
import { authentication } from '../middleware/auth';

const app = new Hono()
    .use('/*', authentication)
    .all('/*', notificationProxy);

export default app;
