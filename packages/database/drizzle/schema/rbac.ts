import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: text('description'),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').notNull().references(() => userRoles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

export const auditRoleChanges = pgTable('audit_role_changes', {
  id: uuid('id').defaultRandom().primaryKey(),
  changedByUserId: uuid('changed_by_user_id').notNull().references(() => users.id),
  targetUserId: uuid('target_user_id').notNull().references(() => users.id),
  oldRoleId: integer('old_role_id').references(() => userRoles.id),
  newRoleId: integer('new_role_id').references(() => userRoles.id),
  oldPermissions: jsonb('old_permissions'),
  newPermissions: jsonb('new_permissions'),
  reason: text('reason'),
  changedAt: timestamp('changed_at').defaultNow(),
});
