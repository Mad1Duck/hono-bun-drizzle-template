import { z } from 'zod';
import { createApiSpec, extendZodWithOpenApi } from '@repo/shared';
import { createNotificationSchema } from './modules/notification/validator/notification.validator';

// Activate .openapi() on Zod schemas for this service.
extendZodWithOpenApi(z);

const CreateNotificationInput = createNotificationSchema.openapi('CreateNotificationInput');

const notificationTag = 'Notifications';

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

const MarkAsReadInput = z.object({
  recipientId: z.string().uuid(),
}).openapi('MarkAsReadInput');

const notificationSpec = createApiSpec({
  title: 'Notification Service API',
  description: 'Notification service OpenAPI specification generated from Zod validators.',
  version: '1.0.0',
  schemas: [CreateNotificationInput, MarkAsReadInput],
  paths: {
    '/v1/notifications': {
      post: {
        tags: [notificationTag],
        summary: 'Create a notification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateNotificationInput' },
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
    '/v1/notifications/{userId}': {
      get: {
        tags: [notificationTag],
        summary: 'List notifications for a user',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            description: 'Recipient user ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/notifications/{notificationId}/read': {
      patch: {
        tags: [notificationTag],
        summary: 'Mark a notification as read',
        parameters: [
          {
            name: 'notificationId',
            in: 'path',
            required: true,
            description: 'Notification ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MarkAsReadInput' },
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

export default notificationSpec;
