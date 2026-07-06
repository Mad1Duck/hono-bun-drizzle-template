import { Hono } from 'hono';
import { create, list, markAsRead } from '../controller/notification.controller';

const app = new Hono()
    .post('/', create)
    .get('/:userId', list)
    .patch('/:notificationId/read', markAsRead);

export default app;
