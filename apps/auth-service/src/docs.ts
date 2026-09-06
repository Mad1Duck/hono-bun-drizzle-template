import { z } from 'zod';
import { createApiSpec, extendZodWithOpenApi } from '@repo/shared';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
} from './modules/auth/validator/auth.validator';

// Activate .openapi() on Zod schemas for this service.
extendZodWithOpenApi(z);

const AuthLoginInput = loginSchema.openapi('AuthLoginInput');
const AuthRegisterInput = registerSchema.openapi('AuthRegisterInput');
const AuthRefreshTokenInput = refreshTokenSchema.openapi('AuthRefreshTokenInput');

const authTag = 'Authentication';

const authSpec = createApiSpec({
  title: 'Auth Service API',
  description: 'Authentication service OpenAPI specification generated from Zod validators.',
  version: '1.0.0',
  schemas: [AuthLoginInput, AuthRegisterInput, AuthRefreshTokenInput],
  paths: {
    '/v1/auth/login': {
      post: {
        tags: [authTag],
        summary: 'Log in a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation or client error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/v1/auth/register': {
      post: {
        tags: [authTag],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRegisterInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation or client error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/v1/auth/refresh': {
      post: {
        tags: [authTag],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRefreshTokenInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation or client error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/v1/auth/logout': {
      post: {
        tags: [authTag],
        summary: 'Log out a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRefreshTokenInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation or client error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
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
                    redis: { type: 'boolean' },
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

export default authSpec;
