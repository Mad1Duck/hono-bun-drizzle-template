import { ContentfulStatusCode } from "hono/utils/http-status";

export const ERROR_CATALOG = {
  VALIDATION_ERROR: { statusCode: 400, message: "Request validation failed" },
  INVALID_JSON: { statusCode: 400, message: "Invalid JSON format" },
  INVALID_CREDENTIALS: { statusCode: 401, message: "Invalid username or password" },
  TOO_MANY_ATTEMPTS: { statusCode: 429, message: "Too many login attempts, please try again later" },
  REFRESH_TOKEN_REQUIRED: { statusCode: 400, message: "Refresh token required" },
  INVALID_REFRESH_TOKEN: { statusCode: 401, message: "Invalid refresh token" },
  REFRESH_TOKEN_REVOKED: { statusCode: 401, message: "Refresh token revoked" },
  FORBIDDEN: { statusCode: 403, message: "You don't have permission to access this resource" },
  UNSUPPORTED_MEDIA_TYPE: { statusCode: 415, message: "Unsupported file type" },
  HTTP_EXCEPTION: { statusCode: 500, message: "Request Error" },
  INTERNAL_ERROR: { statusCode: 500, message: "Internal Server Error" },
} as const satisfies Record<string, { statusCode: ContentfulStatusCode; message: string; }>;

export type ErrorCode = keyof typeof ERROR_CATALOG;

interface ResolveErrorOverrides {
  message?: string;
  statusCode?: ContentfulStatusCode;
  fields?: Record<string, string[]>;
  details?: unknown;
}

export const resolveError = (code: ErrorCode, overrides?: ResolveErrorOverrides) => {
  const base = ERROR_CATALOG[code];

  return {
    code,
    statusCode: overrides?.statusCode ?? base.statusCode,
    message: overrides?.message ?? base.message,
    fields: overrides?.fields,
    details: overrides?.details,
  };
};
