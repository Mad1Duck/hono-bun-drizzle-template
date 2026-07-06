import { db, notifications, notificationRecipients } from '@repo/database';
import { and, desc, eq } from 'drizzle-orm';

export async function createNotification({
  senderId,
  title,
  message,
  recipientIds,
}: {
  senderId?: string;
  title: string;
  message: string;
  recipientIds: string[];
}) {
  return await db.transaction(async (tx) => {
    const [notification] = await tx
      .insert(notifications)
      .values({ senderId, title, message })
      .returning();

    if (recipientIds.length) {
      await tx.insert(notificationRecipients).values(
        recipientIds.map((recipientId) => ({
          notificationId: notification.id,
          recipientId,
        })),
      );
    }

    return notification;
  });
}

export async function getNotificationsForUser(recipientId: string) {
  return await db
    .select({
      id: notifications.id,
      senderId: notifications.senderId,
      title: notifications.title,
      message: notifications.message,
      createdAt: notifications.createdAt,
      isRead: notificationRecipients.isRead,
      readAt: notificationRecipients.readAt,
    })
    .from(notificationRecipients)
    .innerJoin(notifications, eq(notificationRecipients.notificationId, notifications.id))
    .where(eq(notificationRecipients.recipientId, recipientId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: string, recipientId: string) {
  const [updated] = await db
    .update(notificationRecipients)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notificationRecipients.notificationId, notificationId),
        eq(notificationRecipients.recipientId, recipientId),
      ),
    )
    .returning();

  return updated ?? null;
}
