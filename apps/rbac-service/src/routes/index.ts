import { Hono } from 'hono';
import { permissionsRoute, rolesRoute } from '../modules/access/route/access.route';

const app = new Hono()
  .route('/roles', rolesRoute)
  .route('/permissions', permissionsRoute);

export default app;
