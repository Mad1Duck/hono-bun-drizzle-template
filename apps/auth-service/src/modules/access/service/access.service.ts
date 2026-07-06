import { db, userRoles, permissions, rolePermissions, auditRoleChanges, users } from '@repo/database';
import { eq, and } from 'drizzle-orm';

export async function listRoles() {
  return await db.select().from(userRoles);
}

export async function createRole(data: { name: string; description?: string; }) {
  const [role] = await db.insert(userRoles).values(data).returning();
  return role;
}

export async function updateRole(id: number, data: { name?: string; description?: string; }) {
  const [role] = await db.update(userRoles).set(data).where(eq(userRoles.id, id)).returning();
  return role ?? null;
}

export async function deleteRole(id: number) {
  const [role] = await db.delete(userRoles).where(eq(userRoles.id, id)).returning();
  return role ?? null;
}

export async function listPermissions() {
  return await db.select().from(permissions);
}

export async function createPermission(data: { name: string; code: string; description?: string; }) {
  const [permission] = await db.insert(permissions).values(data).returning();
  return permission;
}

export async function deletePermission(id: string) {
  const [permission] = await db.delete(permissions).where(eq(permissions.id, id)).returning();
  return permission ?? null;
}

export async function getRolePermissions(roleId: number) {
  return await db
    .select({
      permissionId: permissions.id,
      name: permissions.name,
      code: permissions.code,
      description: permissions.description,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
}

export async function attachPermissionToRole(roleId: number, permissionId: string) {
  const [attached] = await db.insert(rolePermissions).values({ roleId, permissionId }).returning();
  return attached;
}

export async function detachPermissionFromRole(roleId: number, permissionId: string) {
  const [detached] = await db
    .delete(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
    .returning();

  return detached ?? null;
}

export async function changeUserRole({
  changedByUserId,
  targetUserId,
  newRoleId,
  reason,
}: { changedByUserId: string; targetUserId: string; newRoleId: number; reason?: string; }) {
  return await db.transaction(async (tx) => {
    const [targetUser] = await tx.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) return null;

    const oldRoleId = targetUser.roleId;

    const [updatedUser] = await tx
      .update(users)
      .set({ roleId: newRoleId })
      .where(eq(users.id, targetUserId))
      .returning();

    await tx.insert(auditRoleChanges).values({
      changedByUserId,
      targetUserId,
      oldRoleId,
      newRoleId,
      reason,
    });

    return updatedUser;
  });
}
