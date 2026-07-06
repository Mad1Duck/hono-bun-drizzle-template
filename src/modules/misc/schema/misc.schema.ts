import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/schema/auth.schema';

export const appLogs = pgTable('app_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
