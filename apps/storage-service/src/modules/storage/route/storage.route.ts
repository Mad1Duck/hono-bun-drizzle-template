import { Hono } from 'hono';
import { upload, uploadThing } from '../controller/storage.controller';

const app = new Hono()
  .post('/local', upload)
  .post('/remote', uploadThing);

export default app;
