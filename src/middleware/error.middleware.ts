import { Context, ErrorHandler } from "hono";
import { HTTPResponseError } from "hono/types";
import { HTTPException } from "hono/http-exception";
import { failureFromCode } from "@/utils/apiResponse";
import { logError } from "@/utils/logger";

export const errorHandler: ErrorHandler = (error: Error | HTTPResponseError, c: Context) => {
  if (error instanceof HTTPException) {
    logError({ code: "HTTP_EXCEPTION", message: error.message || "Request Error", statusCode: error.status });

    return failureFromCode(c, 'HTTP_EXCEPTION', { message: error.message, statusCode: error.status });
  }

  logError({ code: "INTERNAL_ERROR", message: error.message || "Server Error", statusCode: 500, details: error.stack });

  return failureFromCode(c, 'INTERNAL_ERROR', { message: error.message });
};
