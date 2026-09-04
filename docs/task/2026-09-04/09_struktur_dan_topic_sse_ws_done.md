# Task 9: Struktur dan topic SSE & WebSocket

## Tujuan
Tentukan arsitektur real-time (SSE & WS) yang modular, terpisah dari business logic, dan mengikuti kontrak event ter-normalisasi.

## Temuan saat ini
- Hanya ada WebSocket di `apps/auth-service/src/websocket/index.ts` dengan message bertipe `string` dan topic dinamis dari parameter URL.
- Topic tersimpan di `apps/auth-service/src/constants/topics.ts`, tapi tidak ada type-nya dan belum dipakai secara terpusat.
- SSE belum ada implementasi sama sekali.

## Struktur yang diusulkan

```
apps/gateway/src/stream/
├── connector/
│   ├── ws.connector.ts      # adapter Bun/Hono WebSocket
│   └── sse.connector.ts     # adapter Server-Sent Events
├── codec/
│   ├── encode.ts            # serialize event envelope
│   └── decode.ts            # parse incoming message
├── topics.ts                # daftar topic & event type registry
└── handler.ts               # Hono routes /ws/:topic dan /events/:topic
```

- `packages/codec/` — pure function `encode` / `decode`.
- `packages/connector/` — `WsConnector` dan `SseConnector`.
- Business logic di service cukup memanggil `broadcast(topic, payload)` tanpa tahu transport.

## Topic yang sudah ada

Dari `apps/auth-service/src/constants/topics.ts`:

- `UNCOMPLETED_ORDER`
- `UNCOMPLETED_KITCHEN`
- `FOOD_TOPIC`
- `CATEGORY_TOPIC`

## Topic tambahan yang perlu

- `USER_ACTIVITY`
- `NOTIFICATION`
- `ORDER_STATUS_CHANGED`
- `SYSTEM_BROADCAST`

## Lingkup kerja

1. Pindahkan `topics.ts` ke package `core`/`shared` agar tidak duplikat per service.
2. Buat Hono routes untuk WS dan SSE di `apps/gateway`.
3. Pastikan codec mengembalikan event envelope yang konsisten:
   `{ type: string; topic: string; payload: T; meta?: unknown }`.
4. Pisahkan koneksi (transport) dari serialization (codec) dan topic registry.

## Status

- [x] Pindahkan daftar topic ke `packages/shared/src/constants/topics.ts` dengan type + guard `isTopic`
- [x] Buat `packages/shared/src/stream/codec.ts` (`encode`/`decode`) dan `connector.ts` (`eventHub`/`broadcast`)
- [x] Update `packages/shared/src/index.ts` export topic, codec, connector, dan `VersionedEvent` support `meta`
- [x] Buat `apps/gateway/src/stream/connector/ws.connector.ts` dan `sse.connector.ts`
- [x] Buat `apps/gateway/src/stream/codec/encode.ts`, `decode.ts`, `topics.ts`, `handler.ts`
- [x] Pasang `/${API_VERSION}/ws/:topic` dan `/${API_VERSION}/events/:topic` di `apps/gateway/src/app.ts`
- [x] Update `apps/gateway/src/index.ts` pass `websocket` ke `Bun.serve`
- [x] Update `apps/auth-service/src/constants/topics.ts` re-export dari `@repo/shared`
- [x] Tambah `@repo/*` path di `apps/gateway/tsconfig.json`
- [x] `bun test` di `apps/auth-service` pass (4 pass)
