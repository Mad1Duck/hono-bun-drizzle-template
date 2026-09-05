# Ekstrak Service Auth Domain & Perbaiki Infrastruktur

## Tujuan

Menyelesaikan sisa technical debt arsitektur yang membutuhkan iterasi besar: memisahkan `storage`, `access` (RBAC), dan `email` dari `auth-service` ke service terpisah, membuat integration test Redis Pub/Sub nyata, mengaktifkan Redis event bus default, dan membuat service discovery lebih dinamis.

## Latar Belakang

Setelah task 04 selesai, fondasi sudah kuat:

- JWT middleware terstandarisasi di `@repo/shared`.
- `user-service` sudah punya endpoint `/me`.
- `packages/shared/src/stream/connector.ts` sudah mendukung `RedisEventHub` dengan mock-based test.
- `gateway` dan `.env.example` sudah punya placeholder untuk service discovery.

Tetapi beberapa hal masih perlu iterasi besar:

- `auth-service` masih terlalu besar (auth, storage, RBAC, email worker).
- Integration test Redis event bus masih mock-based, belum diuji dengan Redis nyata.
- `REDIS_EVENT_BUS` masih `false` default.
- Service discovery masih statis env, belum ada helper dinamis.

## Scope

### 1. Ekstrak domain `auth-service` ke service terpisah

Pindahkan dan setup sebagai service mandiri dengan health, env, package.json, dan gateway proxy:

- `apps/storage-service` — endpoint `/v1/upload/local` dan `/v1/upload/remote`
- `apps/rbac-service` — endpoint `/v1/roles` dan `/v1/permissions`
- `packages/workers/email.worker.ts` atau `apps/email-worker` — worker BullMQ email

### 2. Integration test Redis Pub/Sub nyata

- Tambah test yang menjalankan `RedisEventHub` dengan Redis asli.
- Gunakan `ioredis` langsung untuk publish/subscribe, bukan mock.
- Test harus menunjukkan broadcast di instance A diterima di instance B.

### 3. Default `REDIS_EVENT_BUS=true`

- Update `.env.example` agar Redis event bus aktif default.
- Pastikan fallback in-memory tetap works saat Redis tidak tersedia.

### 4. Service discovery helper

- Tambah `getServiceUrl(name, port, suffix?)` di `packages/shared` atau `gateway`.
- Update `gateway/src/config/services.ts` untuk gunakan helper ini.
- Tambah `SERVICE_DISCOVERY_SUFFIX` handling di `gateway/src/config/env.ts`.

## Checklist

- [x] Buat `apps/storage-service` dari modul `auth-service/src/modules/storage`.
- [x] Update `storage` port/adapter di `auth-service` untuk bisa plug ke `storage-service`.
- [x] Update `gateway` untuk proxy ke `STORAGE_SERVICE_URL` di `/v1/upload/*`.
- [x] Buat `apps/rbac-service` dari modul `auth-service/src/modules/access`.
- [x] Update `access` port/adapter di `auth-service` untuk bisa plug ke `rbac-service`.
- [x] Update `gateway` untuk proxy ke `RBAC_SERVICE_URL` di `/v1/roles/*` dan `/v1/permissions/*`.
- [x] Pindahkan `auth-service/src/modules/email` worker ke `packages/workers/email.worker.ts` atau `apps/email-worker`.
- [x] Hapus module `storage`, `access`, dan `email` dari `auth-service` setelah semua proxy berjalan.
- [x] Tambah integration test Redis Pub/Sub nyata di `packages/shared/src/stream/__tests__/connector.redis.integration.test.ts`.
- [x] Pastikan test Redis hanya berjalan saat `REDIS_URL` tersedia atau dengan `describe.skip`.
- [x] Update `.env.example`: `REDIS_EVENT_BUS=true`, `STORAGE_SERVICE_URL`, `RBAC_SERVICE_URL`, `EMAIL_WORKER_ENABLED`.
- [x] Implementasi `getServiceUrl` helper di `packages/shared/src/utils/discovery.ts`.
- [x] Update `gateway/src/config/services.ts` dan `env.ts` untuk `SERVICE_DISCOVERY_SUFFIX`.
- [x] Jalankan `bun run typecheck` dan `bun test` untuk semua app yang terkena.

## Keputusan yang Perlu Dipilih

### 1. Worker email: shared package atau worker service?

- **A.** `packages/workers/email.worker.ts` dijalankan bersama `auth-service` proses terpisah.
- **B.** `apps/email-worker` sebagai service standalone dengan entry point sendiri.

**Rekomendasi default: B** agar lifecycle worker tidak mengganggu auth-service.

### 2. Storage / RBAC: service baru atau tetap di auth-service?

- **A.** Ekstrak ke `apps/storage-service` dan `apps/rbac-service`.
- **B.** Tetap di `auth-service`, hanya rapihkan dengan port/adapter.

**Rekomendasi default: A** untuk clear boundaries dan independent deploy.

### 3. Redis event bus default

- **A.** Default `REDIS_EVENT_BUS=true`.
- **B.** Default `REDIS_EVENT_BUS=false`, aktifkan manual.

**Rekomendasi default: A** karena Redis sudah ada di stack.

## Dampak

- `auth-service` benar-benar hanya menangani credential dan token.
- Storage, RBAC, dan email bisa di-scale dan di-deploy terpisah.
- Redis event bus benar-benar teruji di multi-instance.
- Gateway lebih mudah dikonfigurasi dengan service discovery helper.

## Referensi

- `docs/rules/01_architecture.md` — package boundaries, API versioning, queue conventions.
