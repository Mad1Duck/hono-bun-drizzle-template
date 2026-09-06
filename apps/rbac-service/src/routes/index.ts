import { Hono } from 'hono';
import { permissionsRoute, rolesRoute } from '../modules/access/route/access.route';
import rbacSpec from '../docs';

const app = new Hono()
  .route('/roles', rolesRoute)
  .route('/permissions', permissionsRoute)
  .get('/docs', (c) => c.json(rbacSpec));

export default app;
