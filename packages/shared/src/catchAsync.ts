import { Context, Next } from "hono";
import ApiError from "./apiError";
import { failure, failureFromCode } from "./apiResponse";
import { logger } from "@repo/logger";

export const catchAsync = <T>(fn: (c: Context, next: Next) => T) => async (c: Context, next: Next) => {
  try {
    const result = await fn(c, next) as T;
    return result as T extends Promise<infer U> ? U : T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      return failure(c, error.statusCode, {
        code: error.code,
        message: error.message,
        fields: error.fields,
        details: error.details,
      }) as T extends Promise<infer U> ? U : T;
    }

    const message = error?.message || "Internal Server Error";
    logger.error({ code: "INTERNAL_ERROR", statusCode: 500, err: error }, message);

    return failureFromCode(c, 'INTERNAL_ERROR', { message }) as T extends Promise<infer U> ? U : T;
  }
};
