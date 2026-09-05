import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createPermissionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});

export const attachPermissionSchema = z.object({
  permissionId: z.string().uuid(),
});

export const changeUserRoleSchema = z.object({
  reason: z.string().optional(),
});
