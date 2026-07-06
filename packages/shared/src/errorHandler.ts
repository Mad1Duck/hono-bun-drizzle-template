import { Context, ErrorHandler } from "hono";
import { HTTPResponseError } from "hono/types";
import { HTTPException } from "hono/http-exception";
import { failureFromCode } from "./apiResponse";
import { logger } from "@repo/logger";

export const errorHandler: ErrorHandler = (error: Error | HTTPResponseError, c: Context) => {
  if (error instanceof HTTPException) {
    logger.error({ code: "HTTP_EXCEPTION", statusCode: error.status }, error.message || "Request Error");

    return failureFromCode(c, 'HTTP_EXCEPTION', { message: error.message, statusCode: error.status });
  }

  logger.error({ code: "INTERNAL_ERROR", statusCode: 500, err: error }, error.message || "Server Error");

  return failureFromCode(c, 'INTERNAL_ERROR', { message: error.message });
};
