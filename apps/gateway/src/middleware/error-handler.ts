import { Context, ErrorHandler } from 'hono';
import { HTTPResponseError } from 'hono/types';
import { HTTPException } from 'hono/http-exception';
import { failureFromCode, ApiError } from '../lib/response';
import { logger } from '@repo/logger';

export const errorHandler: ErrorHandler = (error: Error | HTTPResponseError, c: Context) => {
  if (error instanceof ApiError) {
    logger.error({ code: error.code, statusCode: error.statusCode, err: error }, error.message || 'Request Error');
    return failureFromCode(c, error.code as any, { message: error.message, statusCode: error.statusCode, fields: error.fields, details: error.details });
  }

  if (error instanceof HTTPException) {
    logger.error({ code: 'HTTP_EXCEPTION', statusCode: error.status }, error.message || 'Request Error');
    return failureFromCode(c, 'HTTP_EXCEPTION', { message: error.message, statusCode: error.status });
  }

  logger.error({ code: 'INTERNAL_ERROR', err: error }, error.message || 'Gateway Error');
  return failureFromCode(c, 'INTERNAL_ERROR', { message: error.message });
};
