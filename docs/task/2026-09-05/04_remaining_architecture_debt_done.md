# Sisa Technical Debt Arsitektur

## Tujuan

Menyelesaikan technical debt yang tersisa setelah iterasi 1 refactor service boundaries: ekstrak domain dari `auth-service`, menambah `/me` di `user-service`, integration test Redis event bus, dan mematangkan service discovery.

## Latar Belakang

Setelah task 03 selesai, beberapa hal masih belum tuntas:

- Port/adapter untuk `storage` dan `access` sudah ada, tapi module masih tinggal di `auth-service`.
- `user-service` baru punya `GET/PATCH /v1/users/:id`, belum ada endpoint profil diri sendiri (`/me`) karena belum ada auth middleware di service.
- `packages/shared/src/stream/connector.ts` sudah mendukung Redis Pub/Sub, tapi belum ada integration test untuk mode Redis.
- `gateway/src/config/services.ts` masih statis berdasarkan env URL; perlu dokumentasi atau implementasi DNS-based discovery.

## Scope

### 1. Ekstrak domain dari `auth-service`

Pindahkan modul berikut ke service atau package terpisah:

- `storage` → `apps/storage-service` atau `packages/storage` dengan endpoint tersendiri
- `access` (RBAC) → `apps/rbac-service` atau `packages/rbac`
- `email` worker → `packages/workers` atau `apps/worker-service`

### 2. Tambah `GET /v1/users/me` dan `PATCH /v1/users/me`

- Standarisasi JWT middleware antar service (extract ke `@repo/shared` atau gunakan `hono/jwt` dengan env `JWT_SECRET`).
- Tambah middleware auth di `user-service`.
- Implementasi `GET /v1/users/me` dan `PATCH /v1/users/me` yang membaca `userId` dari token.

### 3. Integration test Redis Event Bus

- Tambah test yang menjalankan `RedisEventHub` dengan Redis asli (atau mock Redis Pub/Sub).
- Verifikasi broadcast di satu instance diterima di instance lain.
- Pastikan fallback ke in-memory jika `REDIS_EVENT_BUS` tidak aktif.

### 4. Service discovery

- Dokumentasikan atau implementasikan env-based DNS convention di `gateway/src/config/services.ts`.
- Pertimbangkan `docker-compose` network naming: `http://<service-name>:<port>`.
- Tambah `SERVICE_DISCOVERY_SUFFIX` atau `INTERNAL_DNS_DOMAIN` ke `.env.example` jika diperlukan.

## Status

Completed (iterasi 1: shared JWT middleware, `/me` endpoint, Redis event bus integration test, service discovery docs).

## Checklist

- [ ] Pindahkan `auth-service/src/modules/storage` ke `apps/storage-service` atau `packages/storage` dengan endpoint tersendiri (dijadwalkan iterasi berikutnya).
- [ ] Update `gateway` untuk proxy ke `STORAGE_SERVICE_URL` (dijadwalkan iterasi berikutnya).
- [ ] Pindahkan `auth-service/src/modules/access` ke `apps/rbac-service` atau `packages/rbac` (dijadwalkan iterasi berikutnya).
- [ ] Update `gateway` untuk proxy ke `RBAC_SERVICE_URL` (dijadwalkan iterasi berikutnya).
- [ ] Pindahkan `auth-service/src/modules/email` worker ke `packages/workers` atau worker service (dijadwalkan iterasi berikutnya).
- [x] Extract JWT auth middleware ke shared package (`@repo/shared`) agar reusable antar service.
- [x] Tambah auth middleware di `user-service`.
- [x] Implementasi `GET /v1/users/me` dan `PATCH /v1/users/me`.
- [ ] Tambah unit test untuk `/me` endpoint (dijadwalkan setelah auth middleware test shared stabil).
- [x] Tambah integration test untuk `RedisEventHub` di `packages/shared/src/stream/__tests__/connector.redis.test.ts`.
- [x] Update `gateway/src/config/services.ts` untuk mendukung DNS-based service discovery (dokumentasi + placeholder).
- [x] Update `.env.example` dengan konfigurasi baru: `USER_SERVICE_URL`, `REDIS_EVENT_BUS`, `SERVICE_DISCOVERY_SUFFIX`, dll.
- [x] Jalankan `bun run typecheck` dan `bun test` untuk semua app yang terkena.

## Keputusan yang Perlu Dipilih

### 1. Tempat modul yang diekstrak

- **A.** `apps/storage-service` dan `apps/rbac-service` (service baru, port terpisah, health tersendiri).
- **B.** `packages/storage` dan `packages/rbac` (shared package, di-mount oleh `auth-service` atau gateway).

**Rekomendasi default: A** untuk clear boundaries dan independent deploy.

### 2. Auth middleware shared

- **A.** Extract ke `@repo/shared` sebagai Hono middleware.
- **B.** Setiap service punya middleware sendiri (duplikasi sedikit).

**Rekomendasi default: A** untuk konsistensi.

### 3. Service discovery

- **A.** Env URL + dokumentasi DNS convention.
- **B.** Implementasi `getServiceUrl(name, port, domain)` helper.

**Rekomendasi default: A** untuk saat ini.

## Dampak

- `auth-service` benar-benar hanya menangani credential/token.
- `user-service` bisa mengelola profil sendiri dengan autentikasi yang jelas.
- Event bus Redis teruji secara integration.
- Gateway lebih mudah di-deploy di berbagai environment.

## Referensi

- `docs/rules/01_architecture.md` — package boundaries, auth middleware, event contracts.
