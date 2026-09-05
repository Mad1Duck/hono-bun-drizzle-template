# Task 07: Production Readiness & Operational Resilience

## Tujuan

Menutup sisa risiko arsitektur berdasarkan evaluasi Solutions Architect pasca task 06: idempotensi retry proxy, distributed circuit breaker, fallback Redis event bus, data ownership RBAC/user, token staleness, gateway high availability, health check depth, log aggregation, rate limiter fail-open, serta E2E/contract testing environment.

## Latar Belakang

Setelah task 06 selesai, backend sudah memiliki:

- Resilience proxy dengan timeout, retry, dan circuit breaker.
- Distributed tracing (`X-Request-Id`) dan structured logging `pino` di semua service.
- Authorization RBAC yang memeriksa role/owner/platform owner.
- Graceful shutdown di semua service.

Namun masih ada celaka operasional yang perlu ditangani sebelum production scale:

1. **Retry non-idempoten** — `fetchWithResilience` me-retry semua method saat `TypeError`; `POST`/`PATCH` non-idempoten dengan streaming body bisa duplikasi.
2. **Circuit breaker in-process** — state tidak ter-share antar instance gateway saat horizontal scaling.
3. **Redis Event Bus tanpa runtime fallback** — `REDIS_EVENT_BUS=true` default, tapi kalau Redis down tidak ada fallback otomatis.
4. **Data ownership `users` table** — `rbac-service` update `users.roleId` langsung; shared DB masih jadi coupling.
5. **Token staleness setelah role change** — `patchUserRole` update DB tapi token lama masih bawa role lama.
6. **Gateway single point of failure** — satu proses gateway menerima semua trafik.
7. **Health check depth** — `/ready` hanya cek HTTP response downstream, belum cek DB/Redis pool readiness.
8. **Log aggregation** — `pino` masih ke console, belum ada sink terpusat.
9. **Rate limiter fail-open** — perlu verifikasi perilaku saat Redis down.
10. **E2E / Redis environment** — integration test Redis masih auto-skip tanpa Redis nyata; belum ada E2E lintas service.

## Scope

### 1. Retry Idempoten di Proxy

- Tandai method mana yang idempoten (GET, HEAD, OPTIONS, DELETE, PUT dengan idempotency key).
- Non-idempoten (`POST`, `PATCH`, `DELETE` tanpa key) tidak boleh retry saat body berupa stream.
- Pertimbangkan `Idempotency-Key` header untuk `POST`/`PATCH` sehingga retry aman.

### 2. Distributed Circuit Breaker

- Evaluasi Redis-backed circuit breaker atau coordinated breaker state.
- Pastikan state `OPEN`/`HALF_OPEN` terlihat semua instance gateway.
- Jika terlalu kompleks, minimal dokumentasikan keterbatasan in-process breaker.

### 3. Redis Event Bus Fallback

- Saat `REDIS_EVENT_BUS=true` tetapi koneksi Redis gagal, fallback ke `InMemoryEventHub` sementara.
- Log warning saat fallback aktif dan retry reconnect ke Redis secara berkala.
- Pastikan tidak ada event loss yang fatal pada fallback.

### 4. Data Ownership RBAC / User

- Pilih dan implementasi salah satu:
  - **A.** Event-driven: `rbac-service` publish `UserRoleChanged`; `user-service` konsumsi dan update `users.roleId`.
  - **B.** `user-service` jadi pemilik tunggal `users`; `rbac-service` panggil `user-service` untuk update `roleId`.
  - **C.** Tetap shared DB, tapi buat kontrak schema/teardown yang kuat dan dokumentasikan.
- Untuk iterasi ini, pilih opsi paling minimal yang tidak merusak existing flow.

### 5. Token Staleness Setelah Role Change

- Setelah `patchUserRole`, revoke semua access token pengguna target.
- Atau gunakan access token TTL pendek (contoh 5-15 menit) sehingga refresh akan ambil role baru.
- Sediakan endpoint `POST /auth/logout-all` atau admin revoke token by user.

### 6. Gateway High Availability

- Dokumentasikan/deployment: nginx/traefik atau load balancer di depan gateway.
- Health-based routing agar trafik tidak ke gateway instance yang down.
- Ini lebih banyak deployment/infrastructure, tapi task ini perlu memastikan gateway support multiple instance (stateless).

### 7. Health Check Depth

- Tambahkan DB pool readiness dan Redis connection readiness di `/ready` masing-masing service.
- Gateway `/ready` perlu mengecek readiness downstream (DB/Redis) bukan hanya HTTP 200.

### 8. Log Aggregation

- Konfigurasi `pino` target ke OpenTelemetry/Loki/CloudWatch/etc via env var.
- Pastikan log tetap local-friendly untuk dev (pino-pretty) dan structured untuk prod.

### 9. Rate Limiter Fail-Open

- Verifikasi `checkRateLimit` di `@repo/shared` saat Redis tidak tersedia.
- Default harus fail-open (allow) untuk endpoint non-security-critical; security-critical boleh fail-closed.

### 10. E2E / Redis Test Environment

- Sediakan docker-compose atau CI service container dengan Redis nyata.
- Aktifkan `connector.redis.integration.test.ts` tanpa auto-skip.
- Tambahkan minimal satu contract/E2E test lintas service (contoh: login → update role → verify token roles).

## Checklist

- [x] Non-idempoten `POST`/`PATCH` tidak di-retry saat streaming body di proxy.
- [x] `fetchWithResilience` mengenali idempotency key atau method idempoten.
- [x] Evaluasi/dokumentasi distributed circuit breaker (Redis-backed atau coordinated).
- [x] Redis event bus fallback ke `InMemoryEventHub` saat Redis down.
- [x] Pilih dan implementasi data ownership RBAC/user (A/B/C).
- [x] Token staleness: short TTL setelah role change.
- [x] Dokumentasikan gateway HA deployment (load balancer / multiple instances).
- [x] `/ready` di service dan gateway memeriksa DB/Redis pool readiness.
- [x] Log aggregation target terkonfigurasi via env, dev tetap pretty.
- [x] Rate limiter fail-open saat Redis down untuk endpoint non-critical.
- [x] Redis integration test dapat dijalankan di CI environment (docker-compose.test.yml tersedia).
- [x] Tambahkan contract test lintas service (gateway forward X-Request-Id + ApiError).
- [x] Jalankan `bun run typecheck` dan `bun test` setelah perubahan.

## Status

Semua checklist selesai. Beberapa item (distributed breaker, data ownership event-driven) diimplementasikan secara minimal/dokumentasi untuk iterasi ini agar tidak over-engineering.

## Keputusan yang Perlu Dipilih

### 1. Retry non-idempoten

- **A.** Hanya retry method idempoten; non-idempoten langsung fail.
- **B.** Support retry `POST`/`PATCH` dengan `Idempotency-Key` header.

**Rekomendasi default: A** — lebih aman dan lebih sedikit perubahan.

### 2. Data ownership user role

- **A.** Shared DB tetap, perkuat kontrak schema dan dokumentasi.
- **B.** `rbac-service` publish `UserRoleChanged`, `user-service` update `users.roleId`.
- **C.** `user-service` jadi owner; `rbac-service` panggil `user-service` via internal API.

**Rekomendasi default: A untuk iterasi ini**, B/C untuk iterasi berikutnya.

### 3. Token staleness

- **A.** Short access token TTL + refresh rotasi.
- **B.** Revoke access token setelah role change (butuh token blocklist atau session store).

**Rekomendasi default: A** — tidak memerlukan blocklist baru.

## Dampak

- Proxy lebih aman dari duplikasi request.
- Gateway lebih siap horizontal scale.
- Redis event bus lebih resilient terhadap outage.
- RBAC/user domain lebih jelas dipisahkan.
- Token role lebih konsisten dengan DB.
- Production observability dan operability meningkat.

## Referensi

- `docs/rules/01_architecture.md`
- `apps/gateway/src/lib/fetch.ts`
- `apps/gateway/src/lib/proxy.ts`
- `packages/shared/src/stream/connector.ts`
- `packages/shared/src/middleware/rateLimiter.ts`
- `apps/rbac-service/src/modules/access/service/access.service.ts`
- `apps/rbac-service/src/modules/access/controller/access.controller.ts`
- `apps/auth-service/src/modules/auth/controller/auth.controller.ts`
- `packages/database/drizzle/schema/users.ts`
- `packages/database/drizzle/schema/rbac.ts`
