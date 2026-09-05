# Task 08: Next Architecture Improvements

## Tujuan

Meneruskan sisa rekomendasi arsitektur dari evaluasi Solutions Architect pasca task 07. Fokus pada: CI Redis nyata, gateway HA deployment, Loki log sink, token revocation, data ownership `users.roleId`, dan distributed circuit breaker.

## Latar Belakang

Setelah task 07, backend sudah memiliki resilience proxy, health check depth, Redis event bus fallback, short access token TTL, dan dokumentasi HA. Namun sebelum skala production horizontal, masih ada gap berikut:

1. **E2E/Redis CI**: `docker-compose.test.yml` sudah tersedia, tapi pipeline CI belum menjalankan integration test dengan Redis nyata.
2. **Gateway HA deployment**: dokumentasi sudah ada, tapi belum ada konfigurasi konkret (nginx/traefik/docker-compose) dan deployment multi-instance.
3. **Log sink Loki**: logger pino sudah bisa output JSON, tapi belum ada transport khusus ke Grafana Loki.
4. **Token revocation setelah role change**: short TTL membantu, tapi belum ada mekanisme revoke instan setelah `changeUserRole`.
5. **Shared DB coupling `users.roleId`**: `rbac-service` masih update `users` langsung. Untuk skala besar perlu ownership jelas.
6. **Distributed circuit breaker**: breaker saat ini in-process; tidak share state antar instance gateway.

## Scope

### 1. E2E / Redis CI

- Tambahkan GitHub Actions / GitLab CI / pipeline yang menjalankan `docker compose -f docker-compose.test.yml up -d`.
- Jalankan `bun test` dengan `REDIS_HOST=localhost` agar `connector.redis.integration.test.ts` tidak skip.
- Pastikan pipeline menunggu Redis healthy sebelum menjalankan test.

### 2. Gateway HA Deployment

- Buat `docker-compose.ha.yml` dengan 2+ gateway instance + nginx/traefik reverse proxy.
- Tambahkan `nginx.conf` atau `traefik.yml` dengan health check ke `/v1/health/ready`.
- Pastikan graceful shutdown tidak memutus in-flight request.

### 3. Log Sink Loki

- Tambahkan package/transport `pino-loki` atau custom transport ke Grafana Loki.
- Konfigurasi via env: `LOKI_URL`, `LOKI_LABELS`, `LOKI_BATCH_SIZE`.
- Tetap support pretty JSON untuk dev (`LOG_PRETTY=true`).

### 4. Token Revocation

- Pilih mekanisme:
  - **A.** Redis blocklist `revoked:<jti>` atau `revoked:<userId>` dengan TTL sama token.
  - **B.** Session store Redis; setiap request verifikasi ke store.
- Trigger revoke di `changeUserRole` (`rbac-service`) atau `patchUserRole`.
- Gateway perlu mengecek blocklist saat verify JWT.

### 5. Data Ownership `users.roleId`

- Pilih salah satu:
  - **A.** Event-driven: `rbac-service` publish `UserRoleChanged`, `user-service` konsumsi dan update `users.roleId`.
  - **B.** `user-service` jadi owner; `rbac-service` panggil `user-service` internal API untuk update `roleId`.
  - **C.** Tetap shared DB, tapi tegaskan kontrak FK + audit + tidak ada service lain yang update `users`.
- Untuk iterasi ini, pilih opsi yang paling sedikit merusak existing flow.

### 6. Distributed Circuit Breaker

- Implementasi Redis-backed breaker:
  - Key `circuit:<service>:state` (CLOSED/OPEN/HALF_OPEN).
  - Key `circuit:<service>:failures` dengan TTL.
  - Semua gateway instance membaca/menulis state yang sama.
- Pastikan fallback ke in-process breaker jika Redis tidak tersedia.

## Checklist

- [x] Pipeline CI menjalankan integration test dengan Redis nyata.
- [x] `docker-compose.ha.yml` dan konfigurasi reverse proxy tersedia.
- [x] Pino transport ke Loki dikonfigurasi via env.
- [x] Mekanisme token revocation tersedia dan dipicu saat role change.
- [x] `users.roleId` ownership diperkuat via shared-DB contract (opsi C).
- [x] Distributed circuit breaker (Redis-backed) di gateway.
- [x] Jalankan `bun run typecheck` dan `bun test` setelah perubahan.

## Keputusan yang Perlu Dipilih

### 1. Token revocation

- **A.** Redis blocklist per `jti` atau `userId`.
- **B.** Session store Redis.

**Rekomendasi default: A** — lebih sederhana, tidak perlu refactor JWT verification di semua service.

### 2. Data ownership `users.roleId`

- **A.** Event-driven `UserRoleChanged`.
- **B.** `user-service` owner via internal API.
- **C.** Shared DB dengan kontrak ketat.

**Rekomendasi default: A untuk iterasi berikutnya** — membersihkan coupling sekaligus memungkinkan audit trail terdistribusi.

### 3. Distributed breaker

- **A.** Redis-backed breaker.
- **B.** Coordinated breaker dengan leader election.
- **C.** Dokumentasikan keterbatasan in-process.

**Rekomendasi default: A** — paling praktis karena Redis sudah bagian dari stack.

## Dampak

- CI lebih andal dengan integration test Redis.
- Gateway siap HA horizontal.
- Log terpusat ke Loki untuk observability production.
- Token role bisa di-revoke instan.
- Data ownership lebih jelas, mengurangi coupling antar service.
- Circuit breaker terdistribusi mengurangi cascading failure antar instance.

## Referensi

- `docs/deployment/gateway-ha.md`
- `docker-compose.test.yml`
- `packages/logger/src/index.ts`
- `apps/gateway/src/lib/fetch.ts`
- `apps/rbac-service/src/modules/access/service/access.service.ts`
- `packages/database/drizzle/schema/users.ts`
- `packages/database/drizzle/schema/rbac.ts`
