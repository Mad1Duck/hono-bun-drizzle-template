import { z } from 'zod';
import { OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

export { extendZodWithOpenApi, OpenApiGeneratorV3 };

// Extend Zod with .openapi() so every ZodType can carry OpenAPI metadata.
extendZodWithOpenApi(z);

export type OpenApiSpec = Record<string, any>;
export type OpenApiPaths = Record<string, any>;

const metaSuccess = z.object({
  code: z.number().int(),
  status: z.literal('SUCCESS'),
  message: z.string(),
  version: z.string(),
});

const metaError = z.object({
  code: z.number().int(),
  status: z.literal('ERROR'),
  message: z.string().optional(),
  version: z.string(),
});

const errorContract = z.object({
  code: z.string(),
  message: z.string(),
  fields: z.record(z.string(), z.array(z.string())).optional(),
  details: z.any().optional(),
});

const apiSuccessSchema = z.object({
  data: z.any(),
  error: z.null(),
  meta: metaSuccess,
});

const apiErrorSchema = z.object({
  data: z.null(),
  error: errorContract,
  meta: metaError,
});

export const apiResponseSchemas = [
  metaSuccess.openapi('MetaSuccess'),
  metaError.openapi('MetaError'),
  errorContract.openapi('ErrorContract'),
  apiSuccessSchema.openapi('ApiSuccess'),
  apiErrorSchema.openapi('ApiError'),
];

export const createApiSpec = (options: {
  title: string;
  version?: string;
  description?: string;
  schemas?: any[];
  paths?: OpenApiPaths;
}): OpenApiSpec => {
  const definitions = [...apiResponseSchemas, ...(options.schemas ?? [])];
  const generator = new OpenApiGeneratorV3(definitions);
  const base = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: options.title,
      version: options.version ?? '1.0.0',
      description: options.description,
    },
  });

  return {
    ...base,
    paths: options.paths ?? {},
  };
};

export const mergeOpenApiSpecs = (specs: OpenApiSpec[], title = 'Gateway API'): OpenApiSpec => {
  if (specs.length === 0) {
    return createApiSpec({ title });
  }

  const [first, ...rest] = specs;
  const merged: OpenApiSpec = {
    ...first,
    info: { ...(first.info ?? {}), title, version: first.info?.version ?? '1.0.0' },
    paths: { ...(first.paths ?? {}) },
    components: {
      ...(first.components ?? {}),
      schemas: { ...(first.components?.schemas ?? {}) },
    },
  };

  for (const spec of rest) {
    if (spec.paths) {
      Object.assign(merged.paths, spec.paths);
    }
    if (spec.components?.schemas) {
      Object.assign(merged.components!.schemas, spec.components.schemas);
    }
  }

  return merged;
};
