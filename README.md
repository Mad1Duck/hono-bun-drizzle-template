# Backend — Arsitektur & Panduan Tim

Backend ini dibangun sebagai **modular monolith** yang siap berkembang ke arah microservices. Semua service hidup dalam satu repository, tapi setiap `apps/*` punya batas domain yang jelas dan berkomunikasi melalui `gateway` serta event bus.

## Stack

- **Runtime:** Bun (TypeScript)
- **Web framework:** Hono
- **ORM & Database:** Drizzle ORM + PostgreSQL
- **Cache / Token blocklist / Rate limit:** Redis
- **Background jobs:** BullMQ
- **Event streaming:** Redpanda (via `kafkajs`)
- **Logging:** pino
- **Monorepo:** Bun workspaces

## Struktur Repo

```
backend/
├── apps/
│   ├── gateway/            # API entry point & proxy ke service lain
│   ├── auth-service/       # Login, register, refresh, logout
│   ├── user-service/       # Profil & perubahan user
│   ├── rbac-service/       # Role & permission
│   ├── notification-service/
│   ├── storage-service/
│   └── email-worker/       # Worker email via BullMQ
├── packages/
│   ├── shared/             # Middleware, util, API contract, event broker
│   ├── database/           # Drizzle schema, client, migrations
│   ├── logger/             # Pino + Loki sink
│   ├── validation/         # Shared Zod helpers
│   └── config/             # Shared config / env loader
├── docs/
│   ├── rules/01_architecture.md    # Aturan arsitektur & API contract
│   ├── task/YYYY-MM-DD/            # Task journal
│   └── roles/                      # Role persona (default: backend)
├── docker-compose.dev.yml          # Dev env: Postgres + Redis + Redpanda
├── docker-compose.ha.yml           # HA env: multi gateway + Nginx
├── nginx.conf
├── Dockerfile
└── .env.example                    # Daftar environment variables
```

## Arsitektur Secara Umum

### 1. Gateway Pattern

`apps/gateway` adalah satu-satunya entry point yang diexpose ke luar. Semua request client masuk lewat sini, lalu gateway meneruskannya ke `auth-service`, `user-service`, dll.

- Routing: `gateway` → `apps/*/routes`
- Proxy: `apps/gateway/src/lib/proxy.ts`
- Service URLs: `apps/gateway/src/config/services.ts`
- Resilience: circuit breaker, retry, timeout, rate limit

### 2. Modular Monolith

Setiap `apps/*` punya app Hono sendiri dengan middleware, route, dan business logic-nya. Mereka tidak saling `import` source code; komunikasi dilakukan melalui:

- **Synchronous HTTP:** via `gateway` proxy
- **Asynchronous events:** via `packages/shared/src/stream/broker` (InMemory / Redis / Redpanda)

### 3. Event Bus

`packages/shared/src/stream/broker.ts` menyediakan abstraksi `EventBroker` dengan tiga implementasi:

- `InMemoryEventBroker` — untuk dev/test tanpa infrastruktur
- `RedisEventBroker` — untuk single-node atau small deploy
- `RedpandaEventBroker` — untuk durable, scalable event streaming

Pilih provider via `EVENT_BUS_PROVIDER`.

### 4. Shared Database (saat ini)

Semua service mengakses database yang sama (`packages/database`). Ini sengaja untuk memudahkan fase awal. Saat aplikasi tumbuh, database perlu dipisah per service.

### 5. API Contract

Semua REST response mengikuti contract `ApiResponse<T>` di `packages/shared/src/apiResponse.ts`:

```ts
{ data: T | null; error: { code, message, fields? } | null; meta: { code, status, message?, version } }
```

Semua external input harus divalidasi Zod sebelum diproses.

### 6. Observability

Setiap request memiliki tiga ID yang saling terkait:

- `X-Request-Id` — ID unik per request
- `X-Trace-Id` — ID yang sama sepanjang rantai service
- `X-Span-Id` — ID per span/service

ID-ID ini muncul di header response dan log (`packages/shared/src/middleware/request-id.ts` & `request-logger.ts`).

### 7. Middleware Order (di gateway)

```
RequestID → Logger → Security → CORS → Compression → Timeout → Rate Limit → Auth → Route Handler
```

## Setup Development

### 1. Instalasi

```sh
bun install
```

### 2. Environment

Salin `.env.example` ke `.env` dan isi sesuai environment lokal. Setiap `process.env` baru harus didaftarkan di `.env.example`.

### 3. Jalankan Infrastruktur

```sh
docker compose -f docker-compose.dev.yml up -d
```

Menyalakan Postgres, Redis, dan Redpanda.

### 4. Jalankan Development (hanya apps, bukan infra)

`bun run dev` menjalankan semua `apps/*` sekaligus via Turborepo, tapi **tidak menyalakan Postgres/Redis/Redpanda**. Makanya langkah 3 (`docker compose -f docker-compose.dev.yml up -d`) wajib dulu.

```sh
bun run dev
```

Buka `http://localhost:3000` (gateway default).

### Menjalankan satu service saja

```sh
bunx turbo run dev --filter=@repo/auth-service
```

Ganti `auth-service` dengan app yang mau dijalankan.

### Perlu docker compose tiap service?

Tidak perlu. Satu `docker-compose.dev.yml` sudah cukup untuk seluruh infrastruktur yang dibagi semua `apps/*`. Per-app docker compose justru menambah kompleksitas dan waktu maintain.

## Deployment

- **Single node / dev:** `docker-compose.dev.yml`
- **High availability:** `docker-compose.ha.yml` (multi gateway + Nginx load balancer)
- **Docker image:** `Dockerfile` di root

## Dokumentasi API (OpenAPI)

Spesifikasi OpenAPI dibuat otomatis dari Zod validator di setiap service. Setiap service menyediakan endpoint `/${API_VERSION}/docs` yang berisi spec JSON untuk domain-nya, dan `gateway` menggabungkan semuanya menjadi satu spec terpusat.

### Akses OpenAPI

- Per service (JSON):
  - Auth: `http://localhost:3001/v1/docs`
  - User: `http://localhost:3002/v1/docs`
  - Storage: `http://localhost:3003/v1/docs`
  - Notification: `http://localhost:3004/v1/docs`
  - RBAC: `http://localhost:3005/v1/docs`

- Gateway (terpusat):
  - JSON: `http://localhost:3000/v1/docs`
  - Swagger UI: `http://localhost:3000/v1/docs/ui`

Semua skema input (body, path params) berasal dari Zod validators yang dipakai oleh masing-masing route. Gateway membutuhkan env `*_SERVICE_URL` (atau default `SERVICE_DISCOVERY_SUFFIX`) untuk mengambil spec dari tiap service. Pastikan service yang ingin muncul di UI sudah berjalan; spec di-cache selama 60 detik.

## Testing

```sh
# Type check
bun run typecheck

# Run unit tests once (Vitest)
bun run test

# Watch mode
bun run test:watch

# Run with coverage
bun run test:coverage
```

Semua perubahan API harus diikuti unit test. Mock DB/Redis/external HTTP; integration test harus reset state antar test.

## Aturan Penting

- Lihat `docs/rules/01_architecture.md` untuk konvensi lengkap.
- Jangan hardcode secret; selalu pakai env.
- Jangan log token, secret, atau PII.
- Jangan push ke `main`; pakai feature branch.
- Setiap task disimpan di `docs/task/YYYY-MM-DD/` dan ditandai `_done` saat selesai.

## Troubleshooting

### `bun run dev` error `ECONNREFUSED 127.0.0.1:6379`

Redis belum berjalan. Jalankan infrastruktur dulu:

```sh
docker compose -f docker-compose.dev.yml up -d
```

### `docker compose ...` error `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

Docker Desktop / Docker daemon belum menyala. Pastikan Docker Desktop berjalan sebelum menjalankan `docker compose`.

### Warning `the attribute version is obsolete`

Warning non-fatal. Compose Spec v2 mengabaikan field `version` di awal file. Kalau muncul, proses tetap berjalan.

## Catatan Perkembangan

- Fase ini sengaja **modular monolith** supaya cepat di-develop, tapi sudah dibangun agar bisa dievolusi ke microservices (DB per service, gRPC/internal contract lebih ketat).
- `docker-compose.dev.yml` sekarang include Redpanda untuk development event streaming.
