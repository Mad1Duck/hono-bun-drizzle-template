import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/schema/auth.schema';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notificationRecipients = pgTable('notification_recipients', {
  notificationId: uuid('notification_id').notNull().references(() => notifications.id),
  recipientId: uuid('recipient_id').notNull().references(() => users.id),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
}, (t) => ({
  pk: primaryKey({ columns: [t.notificationId, t.recipientId] }),
}));
