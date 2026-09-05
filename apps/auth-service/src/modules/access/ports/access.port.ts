import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { userRoles, permissions, rolePermissions, auditRoleChanges } from '@repo/database';

export type Role = InferSelectModel<typeof userRoles>;
export type CreateRoleInput = InferInsertModel<typeof userRoles>;
export type Permission = InferSelectModel<typeof permissions>;
export type CreatePermissionInput = InferInsertModel<typeof permissions>;
export type RolePermission = InferSelectModel<typeof rolePermissions>;
export type AuditRoleChange = InferSelectModel<typeof auditRoleChanges>;

export interface RoleRepositoryPort {
  list(): Promise<Role[]>;
  create(data: CreateRoleInput): Promise<Role>;
  update(id: number, data: Partial<CreateRoleInput>): Promise<Role>;
  remove(id: number): Promise<void>;
  getPermissions(roleId: number): Promise<Permission[]>;
  attachPermission(roleId: number, permissionId: string): Promise<RolePermission>;
  detachPermission(roleId: number, permissionId: string): Promise<void>;
  updateUserRole(roleId: number, userId: string): Promise<void>;
}

export interface PermissionRepositoryPort {
  list(): Promise<Permission[]>;
  create(data: CreatePermissionInput): Promise<Permission>;
  remove(id: string): Promise<void>;
}
