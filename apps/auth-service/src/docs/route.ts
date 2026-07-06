import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { openApiDocument } from './openapi';

// Dipasang di /auth/* (bukan root) supaya konsisten dengan path endpoint auth
// yang sebenarnya, dan tetap bisa diakses lewat gateway yang cuma proxy /auth/*.
const app = new Hono()
    .get('/auth/openapi.json', (c) => c.json(openApiDocument))
    .get('/auth/docs', swaggerUI({ url: '/auth/openapi.json' }));

export default app;
