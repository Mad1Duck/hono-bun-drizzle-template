import { Context, Next } from 'hono';
import { z, ZodError, ZodType } from 'zod';
import { failureFromCode } from '@repo/shared';

export const validate = (schema: ZodType) => {
  return async (c: Context, next: Next) => {
    try {
      const contentType = c.req.header('content-type') ?? '';
      const body = contentType.includes('application/json')
        ? await c.req.json()
        : await c.req.parseBody();
      const parsedData = schema.parse(body);
      c.set('parsedData', parsedData);
      await next();
    } catch (error) {

      if (error instanceof SyntaxError) {
        return failureFromCode(c, 'INVALID_JSON');
      } else if (error instanceof ZodError) {
        const { fieldErrors } = z.flattenError(error);

        return failureFromCode(c, 'VALIDATION_ERROR', { fields: fieldErrors });
      } else {
        return failureFromCode(c, 'INTERNAL_ERROR');
      }
    }
  };
};
