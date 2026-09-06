import { z } from 'zod';
import { createApiSpec, extendZodWithOpenApi } from '@repo/shared';
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  attachPermissionSchema,
  changeUserRoleSchema,
} from './modules/access/validator/access.validator';

// Activate .openapi() on Zod schemas for this service.
extendZodWithOpenApi(z);

const CreateRoleInput = createRoleSchema.openapi('CreateRoleInput');
const UpdateRoleInput = updateRoleSchema.openapi('UpdateRoleInput');
const CreatePermissionInput = createPermissionSchema.openapi('CreatePermissionInput');
const AttachPermissionInput = attachPermissionSchema.openapi('AttachPermissionInput');
const ChangeUserRoleInput = changeUserRoleSchema.openapi('ChangeUserRoleInput');

const rolesTag = 'Roles';
const permissionsTag = 'Permissions';

const okResponse = {
  description: 'Success',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiSuccess' },
    },
  },
};

const createdResponse = {
  description: 'Created',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiSuccess' },
    },
  },
};

const badRequestResponse = {
  description: 'Validation or client error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiError' },
    },
  },
};

const serverErrorResponse = {
  description: 'Server error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiError' },
    },
  },
};

const idParam = (name: string) => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string' },
});

const rbacSpec = createApiSpec({
  title: 'RBAC Service API',
  description: 'RBAC service OpenAPI specification generated from Zod validators.',
  version: '1.0.0',
  schemas: [
    CreateRoleInput,
    UpdateRoleInput,
    CreatePermissionInput,
    AttachPermissionInput,
    ChangeUserRoleInput,
  ],
  paths: {
    '/v1/roles': {
      get: {
        tags: [rolesTag],
        summary: 'List all roles',
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
      post: {
        tags: [rolesTag],
        summary: 'Create a role',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRoleInput' },
            },
          },
        },
        responses: {
          '201': createdResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/roles/{id}': {
      patch: {
        tags: [rolesTag],
        summary: 'Update a role',
        parameters: [idParam('id')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRoleInput' },
            },
          },
        },
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
      delete: {
        tags: [rolesTag],
        summary: 'Delete a role',
        parameters: [idParam('id')],
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/roles/{roleId}/permissions': {
      get: {
        tags: [rolesTag],
        summary: 'List permissions attached to a role',
        parameters: [idParam('roleId')],
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
      post: {
        tags: [rolesTag],
        summary: 'Attach a permission to a role',
        parameters: [idParam('roleId')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AttachPermissionInput' },
            },
          },
        },
        responses: {
          '201': createdResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/roles/{roleId}/permissions/{permissionId}': {
      delete: {
        tags: [rolesTag],
        summary: 'Detach a permission from a role',
        parameters: [idParam('roleId'), idParam('permissionId')],
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/roles/{roleId}/users/{userId}': {
      patch: {
        tags: [rolesTag],
        summary: 'Change the role of a user',
        parameters: [idParam('roleId'), idParam('userId')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangeUserRoleInput' },
            },
          },
        },
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/permissions': {
      get: {
        tags: [permissionsTag],
        summary: 'List all permissions',
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
      post: {
        tags: [permissionsTag],
        summary: 'Create a permission',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePermissionInput' },
            },
          },
        },
        responses: {
          '201': createdResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/permissions/{id}': {
      delete: {
        tags: [permissionsTag],
        summary: 'Delete a permission',
        parameters: [idParam('id')],
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service liveness probe',
        responses: {
          '200': {
            description: 'Service is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Service readiness probe',
        responses: {
          '200': {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    db: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Service is degraded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
  },
});

export default rbacSpec;
