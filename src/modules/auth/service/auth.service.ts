import { db } from '@/db';
import { users, authTokens, CreateUserInput } from '../schema/auth.schema';
import { userRoles } from '@/modules/rbac/schema/rbac.schema';
import { and, eq, or } from 'drizzle-orm';
import { bcryptHash, sha256Hash } from '@/utils/hashing';
import { transformPhoneNumber } from '@/utils/formater';

export async function getUsers() {
  return await db.select({
    id: users.id,
    createdAt: users.createdAt,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    phone: users.phone,
    username: users.username,
  }).from(users);
}

export async function getUser({ email, phone }: { email: string; phone: string; }) {
  const phoneFormatted = await transformPhoneNumber(phone);

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      username: users.username,
      createdAt: users.createdAt,
      roles: userRoles.name,
      password: users.password

    })
    .from(users)
    .leftJoin(userRoles, eq(users.roleId, userRoles.id))
    .where(
      or(
        eq(users.email, email.toLowerCase()),
        eq(users.phone, phoneFormatted),
      ),
    )
    .limit(1);

  return user.length ? user[0] : null;
}

export async function createUser(data: CreateUserInput) {
  return await db.transaction(async (tx) => {
    const [role] = await tx
      .select()
      .from(userRoles)
      .where(eq(userRoles.name, 'USER'))
      .limit(1);

    if (!role) throw new Error("Role 'USER' tidak ditemukan");

    const passwordHashed = await bcryptHash(data.password);
    const phoneFormatted = await transformPhoneNumber(data.phone);

    const [user] = await tx
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        password: passwordHashed,
        phone: phoneFormatted,
        username: data.username,
        isPlatformOwner: data.isPlatformOwner ?? false,
        roleId: data.isPlatformOwner ? null : role.id,
      })
      .returning();

    return user;
  });
}

export async function getUserById(id: string) {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      username: users.username,
      createdAt: users.createdAt,
      roles: userRoles.name,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.roleId, userRoles.id))
    .where(eq(users.id, id))
    .limit(1);

  return user.length ? user[0] : null;
}


export async function saveRefreshToken(userId: string, token: string, expiresAt: Date) {
  const [inserted] = await db.insert(authTokens).values({
    userId: userId,
    token: sha256Hash(token),
    type: 'refresh_token',
    createdAt: new Date(),
    expiresAt: expiresAt
  }).returning();

  return inserted;
}


// Rotasi refresh token: nonaktifkan token lama (kalau masih aktif) dan simpan token baru dalam satu transaksi.
// Return null kalau token lama sudah tidak aktif (sudah dipakai sebelumnya / direvoke) -> indikasi reuse/replay.
export async function rotateRefreshToken({
  oldToken,
  userId,
  newToken,
  expiresAt,
}: { oldToken: string; userId: string; newToken: string; expiresAt: Date; }) {
  return await db.transaction(async (tx) => {
    const [deactivated] = await tx
      .update(authTokens)
      .set({ isActive: false, usedAt: new Date() })
      .where(
        and(
          eq(authTokens.token, sha256Hash(oldToken)),
          eq(authTokens.isActive, true),
        ),
      )
      .returning();

    if (!deactivated) return null;

    const [inserted] = await tx
      .insert(authTokens)
      .values({
        userId,
        token: sha256Hash(newToken),
        type: 'refresh_token',
        expiresAt,
      })
      .returning();

    return inserted;
  });
}

export async function revokeRefreshToken(token: string) {
  return await db
    .update(authTokens)
    .set({ isActive: false, usedAt: new Date() })
    .where(eq(authTokens.token, sha256Hash(token)));
}
