# Task 10: Tambah type SSE & WebSocket

## Temuan

- Tidak ada type khusus untuk SSE atau WebSocket event di seluruh kodebase.
- `apps/gateway/src/types/hono.ts` hanya punya `Variables` dengan `requestId`.
- `apps/auth-service/src/websocket/index.ts` pakai `string` untuk `message` dan tidak ada type `topic`.
- Topik di `apps/auth-service/src/constants/topics.ts` berupa `const string` tanpa type union.

## Type yang perlu dibuat

Buat satu file type, misal `packages/types/src/stream.ts` atau `apps/gateway/src/types/stream.ts`:

```ts
export type SseEvent<T = unknown> = {
  id?: string;
  event?: string;
  data: T;
  retry?: number;
};

export type WsEvent<T = unknown> = {
  type: string;
  topic: Topic;
  payload: T;
  timestamp: number;
};

export type EventEnvelope<T = unknown> =
  | { transport: "sse"; payload: SseEvent<T> }
  | { transport: "ws"; payload: WsEvent<T> };

export type Topic =
  | "UNCOMPLETED_ORDER"
  | "UNCOMPLETED_KITCHEN"
  | "FOOD_TOPIC"
  | "CATEGORY_TOPIC"
  | "USER_ACTIVITY"
  | "NOTIFICATION"
  | "ORDER_STATUS_CHANGED"
  | "SYSTEM_BROADCAST";

export type BroadcastFn<T = unknown> = (
  topic: Topic,
  message: WsEvent<T> | SseEvent<T>
) => void;
```

## Lingkup kerja

1. Buat file type di package `types` atau `apps/gateway/src/types/`.
2. Refactor `apps/auth-service/src/websocket/index.ts` agar memakai `WsEvent<unknown>`.
3. Refactor `apps/auth-service/src/constants/topics.ts` agar diekspor sebagai `const TOPICS` dan digunakan sebagai `Topic`.
4. Pastikan codec yang akan dibuat nanti mengembalikan `EventEnvelope<T>`.

## Status

- [x] `packages/shared/src/types/stream.ts` punya `Topic`, `VersionedEvent`, `WsEvent`, `SseEvent`, `EventEnvelope`, `BroadcastFn`
- [x] `packages/shared/src/constants/topics.ts` punya `TOPICS` const + `Topic` union + `isTopic`
- [x] `apps/auth-service/src/constants/topics.ts` re-export dari `@repo/shared`
- [x] `apps/auth-service/src/websocket/index.ts` pakai `encode`/`decode` dan tipe `VersionedEvent`/`WsEvent`
- [x] `bun test` di `apps/auth-service` pass (4 pass)

## Referensi

- `apps/auth-service/src/websocket/index.ts`
- `apps/auth-service/src/constants/topics.ts`
- `apps/gateway/src/types/hono.ts`
