import { db, users } from '@repo/database';
import { eq } from 'drizzle-orm';
import { ApiError } from '@repo/shared';

export async function getUserById(id: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      username: users.username,
      isPlatformOwner: users.isPlatformOwner,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!rows.length) {
    throw new ApiError('NOT_FOUND');
  }

  return rows[0];
}

export async function updateUser(id: string, data: Partial<Pick<typeof users.$inferInsert, 'firstName' | 'lastName' | 'phone'>>) {
  const rows = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      username: users.username,
      isPlatformOwner: users.isPlatformOwner,
      createdAt: users.createdAt,
    });

  if (!rows.length) {
    throw new ApiError('NOT_FOUND');
  }

  return rows[0];
}
