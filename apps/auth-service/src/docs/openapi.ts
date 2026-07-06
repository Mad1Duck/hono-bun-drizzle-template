import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema, registerSchema, refreshTokenSchema } from '../modules/auth/validator/auth.validator';
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  attachPermissionSchema,
  changeUserRoleSchema,
} from '../modules/access/validator/access.validator';

const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: z.object({
        data: z.null(),
        error: z.object({
          code: z.string(),
          message: z.string(),
          fields: z.record(z.string(), z.array(z.string())).optional(),
        }),
        meta: z.object({ code: z.number(), status: z.literal('ERROR') }),
      }),
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register user baru',
  request: {
    body: {
      content: { 'application/x-www-form-urlencoded': { schema: registerSchema } },
    },
  },
  responses: {
    201: { description: 'User berhasil didaftarkan' },
    400: errorResponse('Validasi gagal'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login dan dapatkan access + refresh token',
  request: {
    body: {
      content: { 'application/x-www-form-urlencoded': { schema: loginSchema } },
    },
  },
  responses: {
    200: { description: 'Login berhasil' },
    400: errorResponse('Validasi gagal'),
    401: errorResponse('Username/password salah'),
    429: errorResponse('Terlalu banyak percobaan login'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Rotasi refresh token: dapatkan access + refresh token baru',
  request: {
    body: {
      content: { 'application/x-www-form-urlencoded': { schema: refreshTokenSchema } },
    },
  },
  responses: {
    200: { description: 'Token berhasil di-refresh' },
    400: errorResponse('Refresh token tidak dikirim'),
    401: errorResponse('Refresh token invalid/revoked'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Revoke refresh token (logout)',
  request: {
    body: {
      content: { 'application/x-www-form-urlencoded': { schema: refreshTokenSchema } },
    },
  },
  responses: {
    200: { description: 'Logout berhasil' },
    400: errorResponse('Refresh token tidak dikirim'),
    401: errorResponse('Refresh token invalid'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/roles',
  tags: ['Roles'],
  summary: 'List semua role',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: 'Daftar role' },
    401: errorResponse('Belum login'),
    403: errorResponse('Bukan Owner'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/roles',
  tags: ['Roles'],
  summary: 'Buat role baru',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createRoleSchema } } },
  },
  responses: {
    201: { description: 'Role dibuat' },
    400: errorResponse('Validasi gagal'),
    401: errorResponse('Belum login'),
    403: errorResponse('Bukan Owner'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/roles/{id}',
  tags: ['Roles'],
  summary: 'Update role',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
    body: { content: { 'application/json': { schema: updateRoleSchema } } },
  },
  responses: {
    200: { description: 'Role diupdate' },
    400: errorResponse('Validasi gagal'),
    404: errorResponse('Role tidak ditemukan'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/roles/{id}',
  tags: ['Roles'],
  summary: 'Hapus role',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    200: { description: 'Role dihapus' },
    404: errorResponse('Role tidak ditemukan'),
    409: errorResponse('Role masih dipakai'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/permissions',
  tags: ['Permissions'],
  summary: 'List semua permission',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: 'Daftar permission' },
    401: errorResponse('Belum login'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/permissions',
  tags: ['Permissions'],
  summary: 'Buat permission baru',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createPermissionSchema } } },
  },
  responses: {
    201: { description: 'Permission dibuat' },
    400: errorResponse('Validasi gagal'),
    409: errorResponse('Kode permission sudah dipakai'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/permissions/{id}',
  tags: ['Permissions'],
  summary: 'Hapus permission',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.uuid() }),
  },
  responses: {
    200: { description: 'Permission dihapus' },
    404: errorResponse('Permission tidak ditemukan'),
    409: errorResponse('Permission masih terpasang di role lain'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/roles/{roleId}/permissions',
  tags: ['Roles'],
  summary: 'List permission yang terpasang di sebuah role',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ roleId: z.coerce.number().int() }),
  },
  responses: {
    200: { description: 'Daftar permission pada role tsb' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/roles/{roleId}/permissions',
  tags: ['Roles'],
  summary: 'Pasang permission ke role',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ roleId: z.coerce.number().int() }),
    body: { content: { 'application/json': { schema: attachPermissionSchema } } },
  },
  responses: {
    201: { description: 'Permission terpasang' },
    404: errorResponse('Role/permission tidak ditemukan'),
    409: errorResponse('Sudah terpasang sebelumnya'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/roles/{roleId}/permissions/{permissionId}',
  tags: ['Roles'],
  summary: 'Lepas permission dari role',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ roleId: z.coerce.number().int(), permissionId: z.uuid() }),
  },
  responses: {
    200: { description: 'Permission dilepas dari role' },
    404: errorResponse('Permission tidak terpasang di role ini'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/roles/{roleId}/users/{userId}',
  tags: ['Roles'],
  summary: 'Ganti role seorang user jadi roleId ini (tercatat di audit log)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ roleId: z.coerce.number().int(), userId: z.uuid() }),
    body: { content: { 'application/json': { schema: changeUserRoleSchema } } },
  },
  responses: {
    200: { description: 'Role user diubah' },
    400: errorResponse('Validasi gagal'),
    404: errorResponse('User atau role tidak ditemukan'),
  },
});

export const openApiDocument = new OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Auth Service API',
    version: '1.0.0',
    description: 'Endpoint autentikasi: register, login, refresh token (dengan rotasi), logout.',
  },
});
