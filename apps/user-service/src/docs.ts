import { z } from 'zod';
import { createApiSpec, extendZodWithOpenApi } from '@repo/shared';
import { updateUserSchema } from './modules/user/validator/user.validator';

// Activate .openapi() on Zod schemas for this service.
extendZodWithOpenApi(z);

const UserUpdateInput = updateUserSchema.openapi('UserUpdateInput');

const userTag = 'Users';
const userIdParam = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'User ID',
  schema: { type: 'string' },
};

const okResponse = {
  description: 'Success',
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

const userSpec = createApiSpec({
  title: 'User Service API',
  description: 'User service OpenAPI specification generated from Zod validators.',
  version: '1.0.0',
  schemas: [UserUpdateInput],
  paths: {
    '/v1/users/me': {
      get: {
        tags: [userTag],
        summary: 'Get current user profile',
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
      patch: {
        tags: [userTag],
        summary: 'Update current user profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' },
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
    '/v1/users/{id}': {
      get: {
        tags: [userTag],
        summary: 'Get a user by ID',
        parameters: [userIdParam],
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
      patch: {
        tags: [userTag],
        summary: 'Update a user by ID',
        parameters: [userIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' },
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

export default userSpec;
