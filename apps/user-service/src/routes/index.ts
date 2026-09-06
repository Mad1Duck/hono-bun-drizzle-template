import { Hono } from 'hono';
import health from './health';
import users from '../modules/user/route/user.route';
import userSpec from '../docs';

const app = new Hono()
  .route('/health', health)
  .route('/users', users)
  .get('/docs', (c) => c.json(userSpec));

export default app;
