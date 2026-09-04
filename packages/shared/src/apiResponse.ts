import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiSuccessResponse, ApiErrorResponse, ErrorContract } from "./types/api-response";
import { API_VERSION } from "./constants/api-version";
import { ErrorCode, resolveError } from "./constants/errors";

export const success = <T>(
  c: Context,
  data: T,
  options?: { code?: ContentfulStatusCode; message?: string; }
) => {
  const code = options?.code ?? 200;
  const body: ApiSuccessResponse<T> = {
    data,
    error: null,
    meta: {
      code,
      status: "SUCCESS",
      message: options?.message ?? "Success",
      version: API_VERSION,
    },
  };

  return c.json(body, code);
};

export const failure = (
  c: Context,
  statusCode: ContentfulStatusCode,
  error: ErrorContract
) => {
  const body: ApiErrorResponse = {
    data: null,
    error,
    meta: {
      code: statusCode,
      status: "ERROR",
      version: API_VERSION,
    },
  };

  return c.json(body, statusCode);
};

export const failureFromCode = (
  c: Context,
  code: ErrorCode,
  overrides?: { message?: string; statusCode?: ContentfulStatusCode; fields?: Record<string, string[]>; details?: unknown; }
) => {
  const resolved = resolveError(code, overrides);

  return failure(c, resolved.statusCode, {
    code: resolved.code,
    message: resolved.message,
    fields: resolved.fields,
    details: resolved.details,
  });
};
