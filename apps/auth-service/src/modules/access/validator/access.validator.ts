import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type createRoleSchemaType = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});
export type updateRoleSchemaType = z.infer<typeof updateRoleSchema>;

export const createPermissionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});
export type createPermissionSchemaType = z.infer<typeof createPermissionSchema>;

export const attachPermissionSchema = z.object({
  permissionId: z.string().uuid(),
});
export type attachPermissionSchemaType = z.infer<typeof attachPermissionSchema>;

export const changeUserRoleSchema = z.object({
  reason: z.string().optional(),
});
export type changeUserRoleSchemaType = z.infer<typeof changeUserRoleSchema>;
