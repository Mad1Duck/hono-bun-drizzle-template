import { z } from 'zod';
import { catchAsync, success, ApiError } from '@repo/shared';
import * as HttpStatus from 'http-status';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  createPermission,
  deletePermission,
  getRolePermissions,
  attachPermissionToRole,
  detachPermissionFromRole,
  changeUserRole,
} from '../service/access.service';
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  attachPermissionSchema,
  changeUserRoleSchema,
} from '../validator/access.validator';

const FK_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';

const pgErrorCode = (error: any): string | undefined => error?.cause?.code ?? error?.code;

const parseOrThrow = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    throw new ApiError('VALIDATION_ERROR', { fields: fieldErrors as Record<string, string[]> });
  }
  return parsed.data;
};

// Roles
export const getRoles = catchAsync(async (c) => {
  const roles = await listRoles();
  return success(c, roles, { message: 'Roles fetched successfully' });
});

export const postRole = catchAsync(async (c) => {
  const data = parseOrThrow(createRoleSchema, await c.req.json());
  const role = await createRole(data);

  return success(c, role, { code: HttpStatus.default.CREATED, message: 'Role created successfully' });
});

export const patchRole = catchAsync(async (c) => {
  const id = Number(c.req.param('id'));
  const data = parseOrThrow(updateRoleSchema, await c.req.json());

  const role = await updateRole(id, data);
  if (!role) throw new ApiError('NOT_FOUND', { message: 'Role not found' });

  return success(c, role, { message: 'Role updated successfully' });
});

export const removeRole = catchAsync(async (c) => {
  const id = Number(c.req.param('id'));

  try {
    const role = await deleteRole(id);
    if (!role) throw new ApiError('NOT_FOUND', { message: 'Role not found' });

    return success(c, role, { message: 'Role deleted successfully' });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (pgErrorCode(error) === FK_VIOLATION) {
      throw new ApiError('CONFLICT', { message: 'Role masih dipakai oleh user atau permission lain' });
    }
    throw error;
  }
});

// Permissions
export const getPermissions = catchAsync(async (c) => {
  const items = await listPermissions();
  return success(c, items, { message: 'Permissions fetched successfully' });
});

export const postPermission = catchAsync(async (c) => {
  const data = parseOrThrow(createPermissionSchema, await c.req.json());

  try {
    const permission = await createPermission(data);
    return success(c, permission, { code: HttpStatus.default.CREATED, message: 'Permission created successfully' });
  } catch (error: any) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new ApiError('CONFLICT', { message: 'Kode permission sudah dipakai' });
    }
    throw error;
  }
});

export const removePermission = catchAsync(async (c) => {
  const id = c.req.param('id')!;

  try {
    const permission = await deletePermission(id);
    if (!permission) throw new ApiError('NOT_FOUND', { message: 'Permission not found' });

    return success(c, permission, { message: 'Permission deleted successfully' });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (pgErrorCode(error) === FK_VIOLATION) {
      throw new ApiError('CONFLICT', { message: 'Permission masih terpasang di role lain' });
    }
    throw error;
  }
});

// Role <-> Permission assignment
export const getRolePermissionsHandler = catchAsync(async (c) => {
  const roleId = Number(c.req.param('roleId'));
  const items = await getRolePermissions(roleId);

  return success(c, items, { message: 'Role permissions fetched successfully' });
});

export const postAttachPermission = catchAsync(async (c) => {
  const roleId = Number(c.req.param('roleId'));
  const data = parseOrThrow(attachPermissionSchema, await c.req.json());

  try {
    const attached = await attachPermissionToRole(roleId, data.permissionId);
    return success(c, attached, { code: HttpStatus.default.CREATED, message: 'Permission attached to role' });
  } catch (error: any) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new ApiError('CONFLICT', { message: 'Permission sudah terpasang di role ini' });
    }
    if (pgErrorCode(error) === FK_VIOLATION) {
      throw new ApiError('NOT_FOUND', { message: 'Role atau permission tidak ditemukan' });
    }
    throw error;
  }
});

export const removeAttachedPermission = catchAsync(async (c) => {
  const roleId = Number(c.req.param('roleId'));
  const permissionId = c.req.param('permissionId')!;

  const detached = await detachPermissionFromRole(roleId, permissionId);
  if (!detached) throw new ApiError('NOT_FOUND', { message: 'Permission tidak terpasang di role ini' });

  return success(c, detached, { message: 'Permission detached from role' });
});

// User role assignment
export const patchUserRole = catchAsync(async (c) => {
  const roleId = Number(c.req.param('roleId'));
  const targetUserId = c.req.param('userId')!;
  const { id: changedByUserId } = c.get('jwtPayload') as { id: string; };
  const data = parseOrThrow(changeUserRoleSchema, await c.req.json());

  try {
    const updated = await changeUserRole({
      changedByUserId,
      targetUserId,
      newRoleId: roleId,
      reason: data.reason,
    });

    if (!updated) throw new ApiError('NOT_FOUND', { message: 'User not found' });

    return success(c, updated, { message: 'User role updated successfully' });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (pgErrorCode(error) === FK_VIOLATION) {
      throw new ApiError('NOT_FOUND', { message: 'Role tidak ditemukan' });
    }
    throw error;
  }
});
