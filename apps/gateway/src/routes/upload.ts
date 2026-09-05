import { Hono } from 'hono';
import { storageProxy } from '../proxy/storage.proxy';
import { authentication } from '../middleware/auth';

const app = new Hono()
  .use('/*', authentication)
  .all('/*', storageProxy);

export default app;
