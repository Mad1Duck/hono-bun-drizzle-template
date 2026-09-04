import { type ApiVersion } from "../constants/api-version";

export type Meta = {
  code: number;
  status: "SUCCESS" | "ERROR";
  message?: string;
  version: ApiVersion;
};

export type ApiSuccessResponse<T> = {
  data: T;
  error: null;
  meta: Meta & {
    status: "SUCCESS";
    message: string;
    version: ApiVersion;
  };
};

export type ErrorContract = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  details?: unknown;
};

export type ApiErrorResponse = {
  data: null;
  error: ErrorContract;
  meta: Meta & {
    status: "ERROR";
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
