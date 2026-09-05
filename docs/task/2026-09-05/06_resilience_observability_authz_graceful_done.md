# Task 06: Resilience, Observability, Authorization, dan Graceful Shutdown

## Tujuan

Menutup celaka arsitektur yang muncul setelah service boundaries sudah rapi: proxy gateway belum resilient, tracing/observability belum merata, authorization masih hanya otentikasi, graceful shutdown belum diterapkan di semua service, serta beberapa catatan skalabilitas dan data ownership.

## Latar Belakang

Refactor service boundaries sudah selesai (`05_extract_services_and_infrastructure_done.md`), tetapi dari sisi Solutions Architect ditemukan gap berikut:

1. **Resilience Proxy** — `apps/gateway/src/lib/proxy.ts` pakai `fetch` polos tanpa timeout, retry, dan circuit breaker.
2. **Distributed Tracing & Observability** — `requestId` hanya di gateway, tidak dipropagasi ke downstream; logging `pino` belum merata.
3. **Authorization** — `createAuthentication` hanya cek JWT; `rbac-service` tidak memvalidasi admin/role.
4. **Graceful Shutdown** — hanya `email-worker` yang menangani `SIGINT`.
5. **Data Ownership** — `rbac-service` update `users.roleId` secara langsung.
6. **Redis Pub/Sub Scalability** — `RedisEventHub` psubscribe ke `v1:*` semua.
7. **Test & Environment** — integration test Redis auto-skip.
8. **Konfigurasi Port** — `getServiceUrl` hardcode port.

## Scope

### 1. Resilience Proxy

- Tambahkan timeout, retry dengan exponential back-off, dan circuit breaker di proxy gateway.
- Pilihan pendekatan: gunakan `axios` dengan adapter atau `fetch` + `AbortController` + `async-retry`.
- Handle `ECONNREFUSED` dan timeout dengan response JSON sesuai kontrak `ApiError`.
- Pastikan `duplex: 'half'` workaround bisa dilepas atau diganti jika `axios`/fetch stabil.

### 2. Distributed Tracing & Observability

- Propagasi `x-request-id`/`x-correlation-id` dari gateway ke semua downstream.
- Standarisasi structured logging dengan `pino` di setiap `apps/*`.
- Pastikan `requestId` ikut masuk ke log rate limiter dan event bus.

### 3. Authorization

- Perluas middleware `createAuthentication` di `@repo/shared` atau buat `createAuthorization`.
- `rbac-service` harus memeriksa role/permission pengguna, bukan hanya `id`.
- Pertimbangkan membawa `roles`/`permissions` di JWT payload, atau middleware query `rbac-service`.

### 4. Graceful Shutdown

- Tangani `SIGTERM`/`SIGINT` di semua `apps/*/src/index.ts`:
  - Tutup `Bun.serve`.
  - Tutup koneksi DB pool / Redis / BullMQ worker.
  - Flush log sink.

### 5. Data Ownership

- Evaluasi `rbac-service` update `users.roleId` langsung.
- Pilihan: pertahankan shared DB dengan kontrak yang kuat, atau pindahkan ke event-driven (outbox/saga) dimana `rbac-service` publish `UserRoleChanged` dan `user-service` konsumsi.

### 6. Redis Pub/Sub Skalability

- Pertimbangkan `RedisEventHub` psubscribe yang lebih spesifik, atau ganti dengan Redis Streams kalau event volume tinggi.
- Untuk saat ini, cukup dokumentasikan batasan dan daftar topik yang dipantau.

### 7. Test & Environment

- Tambahkan contract test atau E2E minimal untuk satu flow lintas service.
- Pertimbangkan environment khusus untuk Redis integration test agar tidak auto-skip.

### 8. Konfigurasi & Port

- Perkaya dokumentasi `getServiceUrl` dan `SERVICE_DISCOVERY_SUFFIX` di `.env.example`.
- Pertimbangkan env `*_SERVICE_PORT` agar port tidak hardcode.

## Checklist

- [x] Resilience proxy: timeout, retry, circuit breaker di `apps/gateway/src/lib/proxy.ts`.
- [x] Pilih antara `axios` vs `fetch` untuk proxy, catat keputusan.
- [x] Handle `ECONNREFUSED`/timeout dengan `ApiError` response JSON.
- [x] Propagasi `x-request-id` ke downstream service dan log.
- [x] Standarisasi structured logging `pino` di semua service.
- [x] Authorization: `rbac-service` memvalidasi admin/role sebelum CRUD role/permission.
- [x] Graceful shutdown `SIGTERM`/`SIGINT` untuk `auth-service`, `user-service`, `notification-service`, `storage-service`, `rbac-service`, `gateway`.
- [x] Evaluasi data ownership `users` table dan `rbac-service` update `roleId`.
- [x] Dokumentasi/penanganan `RedisEventHub` psubscribe pattern.
- [x] Perkaya `.env.example` untuk service discovery dan port.
- [x] Jalankan `bun run typecheck` dan `bun test` setelah perubahan.

## Keputusan yang Diambil

### 1. Library untuk proxy resilience

- **B.** Tetap `fetch` dengan `AbortController`, retry eksponensial manual, dan circuit breaker sederhana.
- Alasan: menghindari bundle/runtime `axios` di Bun; `fetch` sudah cukup untuk kebutuhan proxy dan tetap support `duplex: 'half'` untuk streaming upload.

### 2. Cara membawa authorization

- **A.** JWT payload membawa `roles` (dari `userRoles.name`) dan `isPlatformOwner`.
- `rbac-service` middleware `authenticationAdministrator` memeriksa `isPlatformOwner === true` atau `roles === 'Owner' || 'Admin'`.

### 3. Update `roleId` user

- **A.** Pertahankan shared DB untuk saat ini.
- FK `users.roleId` ke `userRoles.id` sudah menjadi kontrak schema. Refactor event-driven ke `user-service` disarankan untuk iterasi berikutnya jika domain ownership harus lebih ketat.

### 4. Redis Pub/Sub scalability

- Tetap `psubscribe` ke `v1:*` dengan dokumentasi batasan di `packages/shared/src/stream/connector.ts`.
- Upgrade ke per-topik subscription atau Redis Streams disarankan saat volume topik/instansi bertambah.

## Dampak

- Gateway lebih tahan terhadap kegagalan downstream.
- Log lebih mudah ditelusuri lintas service.
- RBAC benar-benar terlindungi dari akses non-admin.
- Deploy/restart lebih aman tanpa request setengah selesai.
- Kontrak antar service lebih jelas.

## Referensi

- `docs/rules/01_architecture.md` — API contract, observability, graceful shutdown, resilience.
- `apps/gateway/src/lib/proxy.ts`
- `packages/shared/src/middleware/auth.ts`
- `apps/rbac-service/src/middleware/auth.middleware.ts`
- `apps/rbac-service/src/modules/access/service/access.service.ts`
- `packages/shared/src/stream/connector.ts`
- `packages/shared/src/utils/discovery.ts`
