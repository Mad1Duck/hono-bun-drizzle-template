import { db } from '@/db';
import { userRoles } from '../schema/rbac.schema';
import { eq, or } from 'drizzle-orm';

export const findRole = ({ id, name }: { id?: number; name?: string; }) => {
  return db
    .select()
    .from(userRoles)
    .where(
      or(
        id !== undefined ? eq(userRoles.id, id) : undefined,
        name !== undefined ? eq(userRoles.name, name) : undefined,
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
};
