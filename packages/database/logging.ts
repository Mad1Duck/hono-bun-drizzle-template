import { db } from './client';
import { appLogs } from './drizzle/schema';

// (tidak otomatis di setiap error, supaya app_logs tidak noise 4xx biasa).
export const logAppEvent = async ({
  userId,
  action,
  metadata,
}: { userId?: string; action: string; metadata?: unknown; }) => {
  await db.insert(appLogs).values({
    userId: userId ?? null,
    action,
    metadata,
  });
};
