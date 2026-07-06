import { bcryptHash } from '@/utils/hashing';
import { db } from './index';
import {
  users,
  userRoles,
  permissions,
  rolePermissions,
} from './schema';

export async function seed() {
  try {

    // 1. Roles
    const [roleOwner] = await db.insert(userRoles).values({ name: 'Owner' }).returning();
    const [roleAdmin] = await db.insert(userRoles).values({ name: 'Admin' }).returning();
    const [roleUser] = await db.insert(userRoles).values({ name: 'USER' }).returning();

    // 2. Permissions contoh
    const [permManageUsers] = await db.insert(permissions).values({
      name: 'Manage Users',
      code: 'users.manage',
      description: 'Kelola data user',
    }).returning();

    // 3. RolePermissions
    await db.insert(rolePermissions).values({
      roleId: roleOwner.id,
      permissionId: permManageUsers.id,
    });
    await db.insert(rolePermissions).values({
      roleId: roleAdmin.id,
      permissionId: permManageUsers.id,
    });

    // 4. User platform: superadmin
    await db.insert(users).values({
      email: 'admin@platform.com',
      password: await bcryptHash("password1"), // gunakan bcrypt hash asli
      isPlatformOwner: true,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '081234567890',
      username: 'superadmin',
    }).returning();

    // 5. User biasa
    await db.insert(users).values({
      email: 'admin@tokoabc.com',
      password: await bcryptHash("password1"),
      firstName: 'Admin',
      lastName: 'TokoABC',
      phone: '081298765432',
      username: 'admintokoabc',
      roleId: roleUser.id,
    }).returning();

    console.log('Seeding selesai');

  } catch (error) {

    console.log(error, 'Gagal');
  }
}



seed();
