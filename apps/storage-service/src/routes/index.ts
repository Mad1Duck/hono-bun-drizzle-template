import { Hono } from 'hono';
import storage from '../modules/storage/route/storage.route';
import storageSpec from '../docs';

const app = new Hono()
  .route('/upload', storage)
  .get('/docs', (c) => c.json(storageSpec));

export default app;
