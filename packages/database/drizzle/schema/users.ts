import { InferInsertModel } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { userRoles } from './rbac';

// Domain user-service: profil user (tanpa credential/password).
// roleId di-owned oleh rbac-service; service lain TIDAK BOLEH update langsung.
// Semua perubahan role harus melalui changeUserRole di rbac-service agar tercatat di audit.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  // roleId di-managed oleh rbac-service (shared-db contract opsi C).
  // Untuk skala besar, pindahkan ke event-driven UserRoleChanged (opsi A).
  roleId: integer('role_id').references(() => userRoles.id),
  isPlatformOwner: boolean('is_platform_owner').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export type CreateUserProfileInput = InferInsertModel<typeof users>;
