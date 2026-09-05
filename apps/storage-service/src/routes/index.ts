import { Hono } from 'hono';
import storage from '../modules/storage/route/storage.route';

const app = new Hono()
  .route('/upload', storage);

export default app;
