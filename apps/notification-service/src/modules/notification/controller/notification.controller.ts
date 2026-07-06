import { z } from 'zod';
import { catchAsync, success, ApiError } from '@repo/shared';
import { createNotification, getNotificationsForUser, markNotificationAsRead } from '../service/notification.service';
import { createNotificationSchema } from '../validator/notification.validator';

export const create = catchAsync(async (c) => {
  const body = await c.req.json();
  const parsed = createNotificationSchema.safeParse(body);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    throw new ApiError('VALIDATION_ERROR', { fields: fieldErrors });
  }

  const notification = await createNotification(parsed.data);

  return success(c, notification, { code: 201, message: "Notification created successfully" });
});

export const list = catchAsync(async (c) => {
  const userId = c.req.param('userId')!;

  const items = await getNotificationsForUser(userId);

  return success(c, items, { message: "Notifications fetched successfully" });
});

export const markAsRead = catchAsync(async (c) => {
  const notificationId = c.req.param('notificationId')!;
  const { recipientId } = await c.req.json();

  if (!recipientId) {
    throw new ApiError('VALIDATION_ERROR', { fields: { recipientId: ['recipientId is required'] } });
  }

  const updated = await markNotificationAsRead(notificationId, recipientId);

  if (!updated) {
    throw new ApiError('NOT_FOUND', { message: 'Notification not found for this recipient' });
  }

  return success(c, updated, { message: "Notification marked as read" });
});
