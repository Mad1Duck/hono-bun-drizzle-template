import { ContentfulStatusCode } from "hono/utils/http-status";
import { ErrorCode, resolveError } from "@/constants/errors";

interface ApiErrorOverrides {
  message?: string;
  statusCode?: ContentfulStatusCode;
  fields?: Record<string, string[]>;
  details?: unknown;
  isOperational?: boolean;
  stack?: string;
}

class ApiError extends Error {
  statusCode: ContentfulStatusCode;
  code: string;
  fields?: Record<string, string[]>;
  details?: unknown;
  isOperational: boolean;

  constructor(code: ErrorCode, overrides?: ApiErrorOverrides) {
    const resolved = resolveError(code, overrides);
    super(resolved.message);

    this.statusCode = resolved.statusCode;
    this.code = resolved.code;
    this.fields = resolved.fields;
    this.details = resolved.details;
    this.isOperational = overrides?.isOperational ?? true;
    if (overrides?.stack) {
      this.stack = overrides.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
