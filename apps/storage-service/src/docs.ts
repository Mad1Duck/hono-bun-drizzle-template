import { createApiSpec } from '@repo/shared';

const uploadTag = 'Storage';

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

const uploadRequestBody = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file to upload',
          },
        },
        required: ['file'],
      },
    },
  },
};

const storageSpec = createApiSpec({
  title: 'Storage Service API',
  description: 'Storage service OpenAPI specification.',
  version: '1.0.0',
  schemas: [],
  paths: {
    '/v1/upload/local': {
      post: {
        tags: [uploadTag],
        summary: 'Upload a file locally',
        requestBody: uploadRequestBody,
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '415': {
            description: 'Unsupported media type',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/upload/remote': {
      post: {
        tags: [uploadTag],
        summary: 'Upload a file to UploadThing',
        requestBody: uploadRequestBody,
        responses: {
          '200': okResponse,
          '400': badRequestResponse,
          '415': {
            description: 'Unsupported media type',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
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
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
  },
});

export default storageSpec;
