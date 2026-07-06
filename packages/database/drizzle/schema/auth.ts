import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const authTokenTypeEnum = pgEnum('auth_token_type', [
  'reset_password',
  'verify_email',
  'refresh_token'
]);

// Domain auth-service: credential (password hash), terpisah dari profil user
export const credentials = pgTable('credentials', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  passwordHash: text('password_hash').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  deviceInfo: varchar('device_info', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
});

export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  type: authTokenTypeEnum('type').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
