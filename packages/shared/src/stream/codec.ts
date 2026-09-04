import { API_VERSION } from "../constants/api-version";
import type { VersionedEvent } from "../types/stream";

export const encode = <T = unknown>(
  topic: string,
  payload: T,
  meta?: unknown
): VersionedEvent<T> => ({
  version: API_VERSION,
  topic,
  payload,
  timestamp: Date.now(),
  ...(meta !== undefined ? { meta } : {}),
});

export const decode = <T = unknown>(
  raw: string | ArrayBuffer | object
): VersionedEvent<T> => {
  if (typeof raw === "string") {
    return JSON.parse(raw) as VersionedEvent<T>;
  }
  if (raw instanceof ArrayBuffer) {
    return JSON.parse(new TextDecoder().decode(raw)) as VersionedEvent<T>;
  }
  return raw as VersionedEvent<T>;
};
