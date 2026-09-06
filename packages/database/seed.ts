import bcrypt from 'bcryptjs';
import { db, users, userRoles, permissions, rolePermissions, credentials } from './index';

const hashPassword = (password: string) => bcrypt.hash(password, 4);

export async function seed() {
  try {
    const [roleOwner] = await db.insert(userRoles).values({ name: 'Owner' }).returning();
    const [roleAdmin] = await db.insert(userRoles).values({ name: 'Admin' }).returning();
    const [roleUser] = await db.insert(userRoles).values({ name: 'USER' }).returning();

    const [permManageUsers] = await db.insert(permissions).values({
      name: 'Manage Users',
      code: 'users.manage',
      description: 'Kelola data user',
    }).returning();

    await db.insert(rolePermissions).values({ roleId: roleOwner.id, permissionId: permManageUsers.id });
    await db.insert(rolePermissions).values({ roleId: roleAdmin.id, permissionId: permManageUsers.id });

    const [superadmin] = await db.insert(users).values({
      email: 'admin@platform.com',
      isPlatformOwner: true,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '081234567890',
      username: 'superadmin',
    }).returning();
    await db.insert(credentials).values({ userId: superadmin.id, passwordHash: await hashPassword('password1') });

    const [adminUser] = await db.insert(users).values({
      email: 'admin@tokoabc.com',
      firstName: 'Admin',
      lastName: 'TokoABC',
      phone: '081298765432',
      username: 'admintokoabc',
      roleId: roleUser.id,
    }).returning();
    await db.insert(credentials).values({ userId: adminUser.id, passwordHash: await hashPassword('password1') });

    console.log('Seeding selesai');
  } catch (error) {
    console.log(error, 'Gagal');
  }
}

seed();
