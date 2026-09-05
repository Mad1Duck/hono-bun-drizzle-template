import { db, users, idempotencyKeys } from '@repo/database';
import { eq } from 'drizzle-orm';
import { logger } from '@repo/logger';
import { createEventBroker, USER_ROLE_CHANGED, type VersionedEvent } from '@repo/shared';

type UserRoleChangedPayload = {
  userId: string;
  oldRoleId: number | null;
  newRoleId: number;
  changedByUserId: string;
  reason?: string;
  updatedAt: string;
};

const idempotencyKey = (userId: string) => `${USER_ROLE_CHANGED}:${userId}`;

const isDuplicate = async (userId: string, updatedAt: string): Promise<boolean> => {
  const rows = await db
    .select({ value: idempotencyKeys.value })
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, idempotencyKey(userId)));

  if (rows.length === 0) return false;

  const existing = new Date(rows[0].value ?? 0).getTime();
  const incoming = new Date(updatedAt).getTime();
  return Number.isNaN(incoming) ? false : incoming <= existing;
};

const markProcessed = async (userId: string, updatedAt: string) => {
  await db
    .insert(idempotencyKeys)
    .values({
      key: idempotencyKey(userId),
      topic: USER_ROLE_CHANGED,
      value: updatedAt,
    })
    .onConflictDoUpdate({
      target: idempotencyKeys.key,
      set: { value: updatedAt, processedAt: new Date() },
    });
};

const applyUserRoleChanged = async (event: VersionedEvent<UserRoleChangedPayload>): Promise<void> => {
  const { userId, newRoleId, updatedAt } = event.payload;
  const timestamp = new Date(updatedAt).getTime();

  if (Number.isNaN(timestamp)) {
    logger.error({ event }, 'UserRoleChanged event has invalid updatedAt');
    return;
  }

  if (await isDuplicate(userId, updatedAt)) {
    logger.debug({ userId, newRoleId, timestamp }, 'duplicate UserRoleChanged event ignored');
    return;
  }

  try {
    await db.update(users).set({ roleId: newRoleId }).where(eq(users.id, userId));
    await markProcessed(userId, updatedAt);
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

const broker = createEventBroker({ clientId: 'user-service', groupId: 'user-service' });

export const startUserRoleChangedConsumer = (): (() => Promise<void>) => {
  const unsubscribe = broker.subscribe((topic, payload) => {
    if (topic !== USER_ROLE_CHANGED) return;
    const event = payload as VersionedEvent<UserRoleChangedPayload>;
    void applyUserRoleChanged(event);
  });

  return async () => {
    unsubscribe();
    await broker.close();
  };
};
