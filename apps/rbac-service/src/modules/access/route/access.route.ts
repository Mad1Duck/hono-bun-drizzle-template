import { Hono } from 'hono';
import { authentication, authenticationAdministrator } from '@/middleware/auth.middleware';
import {
  getRoles,
  postRole,
  patchRole,
  removeRole,
  getPermissions,
  postPermission,
  removePermission,
  getRolePermissionsHandler,
  postAttachPermission,
  removeAttachedPermission,
  patchUserRole,
} from '../controller/access.controller';

export const rolesRoute = new Hono()
  .use('/*', authentication)
  .use('/*', authenticationAdministrator)
  .get('/', getRoles)
  .post('/', postRole)
  .patch('/:id', patchRole)
  .delete('/:id', removeRole)
  .get('/:roleId/permissions', getRolePermissionsHandler)
  .post('/:roleId/permissions', postAttachPermission)
  .delete('/:roleId/permissions/:permissionId', removeAttachedPermission)
  .patch('/:roleId/users/:userId', patchUserRole);

export const permissionsRoute = new Hono()
  .use('/*', authentication)
  .use('/*', authenticationAdministrator)
  .get('/', getPermissions)
  .post('/', postPermission)
  .delete('/:id', removePermission);
