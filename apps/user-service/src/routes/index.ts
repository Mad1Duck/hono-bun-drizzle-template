import { Hono } from 'hono';
import health from './health';
import users from '../modules/user/route/user.route';

const app = new Hono()
  .route('/health', health)
  .route('/users', users);

export default app;
