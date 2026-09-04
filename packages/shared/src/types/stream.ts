import { type ApiVersion, API_VERSION } from "../constants/api-version";

export type VersionedEvent<T = unknown> = {
  version: ApiVersion;
  topic: string;
  payload: T;
  timestamp: number;
};

export type WsEvent<T = unknown> = VersionedEvent<T>;

export type SseEvent<T = unknown> = VersionedEvent<T> & {
  id?: string;
  retry?: number;
};

export type EventEnvelope<T = unknown> =
  | { transport: "ws"; payload: WsEvent<T> }
  | { transport: "sse"; payload: SseEvent<T> };

export type BroadcastFn<T = unknown> = (
  topic: string,
  payload: T
) => void;

export const versionedTopic = (topic: string): string => `${API_VERSION}:${topic}`;

export const parseVersionedTopic = (channel: string): string => {
  const prefix = `${API_VERSION}:`;
  return channel.startsWith(prefix) ? channel.slice(prefix.length) : channel;
};
