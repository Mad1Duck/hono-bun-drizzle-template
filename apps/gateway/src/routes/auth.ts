import { Hono } from 'hono';
import { authProxy } from '../proxy/auth.proxy';

const app = new Hono().all('/*', authProxy);

export default app;
