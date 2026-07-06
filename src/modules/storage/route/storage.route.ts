
import { Hono } from 'hono';
import { uploadThing } from '../controller/storage.controller';

const app = new Hono()
    .post('/upload', uploadThing);

export default app;
