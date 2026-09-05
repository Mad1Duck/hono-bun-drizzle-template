import { db, users } from '@repo/database';
import { eq } from 'drizzle-orm';
import { logger } from '@repo/logger';
import { subscribe, USER_ROLE_CHANGED, type VersionedEvent } from '@repo/shared';

type UserRoleChangedPayload = {
  userId: string;
  oldRoleId: number | null;
  newRoleId: number;
  changedByUserId: string;
  reason?: string;
  updatedAt: string;
};

// In-memory idempotency guard. Redis streams or persistent idempotency
// storage should be used once the service is scaled horizontally.
const lastProcessedAt = new Map<string, number>();

const isDuplicate = (userId: string, timestamp: number): boolean => {
  const last = lastProcessedAt.get(userId) ?? 0;
  return timestamp <= last;
};

const applyUserRoleChanged = async (event: VersionedEvent<UserRoleChangedPayload>): Promise<void> => {
  const { userId, newRoleId, updatedAt } = event.payload;
  const timestamp = new Date(updatedAt).getTime();

  if (Number.isNaN(timestamp)) {
    logger.error({ event }, 'UserRoleChanged event has invalid updatedAt');
    return;
  }

  if (isDuplicate(userId, timestamp)) {
    logger.debug({ userId, newRoleId, timestamp }, 'duplicate UserRoleChanged event ignored');
    return;
  }

  try {
    await db.update(users).set({ roleId: newRoleId }).where(eq(users.id, userId));
    lastProcessedAt.set(userId, timestamp);
    logger.info(
      { userId, newRoleId, changedByUserId: event.payload.changedByUserId },
      'applied UserRoleChanged event',
    );
  } catch (err) {
    logger.error({ err, userId, newRoleId }, 'failed to apply UserRoleChanged event');
    // In production, failed events should be retried via a dead-letter queue.
    throw err;
  }
};

export const startUserRoleChangedConsumer = (): (() => void) => {
  return subscribe((topic, payload) => {
    if (topic !== USER_ROLE_CHANGED) return;
    const event = payload as VersionedEvent<UserRoleChangedPayload>;
    void applyUserRoleChanged(event);
  });
};
