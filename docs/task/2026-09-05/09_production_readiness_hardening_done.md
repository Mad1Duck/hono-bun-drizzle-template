# Task 09: Production Readiness & Architecture Hardening

## Tujuan

Menindaklanjuti hasil evaluasi arsitek (task 08) dengan memperkuat sisi operasional, observability, dan data ownership sebelum backend masuk production horizontal. Fokus pada: graceful shutdown menyeluruh, penguatan Loki log sink, unit test untuk utilities kritis, fail-closed token revocation, event-driven role change, service discovery HA, dan metrics endpoint.

## Latar Belakang

Setelah task 08, backend memiliki:
- API Gateway dengan timeout, retry, circuit breaker (in-process & Redis-backed), dan idempotent retry.
- Health check depth (`/ready` memeriksa DB/Redis).
- Token revocation via Redis blocklist saat role berubah.
- Loki pino sink, gateway HA deployment (docker-compose + nginx), dan CI pipeline Redis.
- Distributed circuit breaker Redis-backed.

Namun masih ada architectural debt yang harus diselesaikan sebelum production:
1. **Graceful shutdown belum menyeluruh** — DB pool ditutup, tapi Redis, BullMQ, WebSocket, dan Loki flush belum tertutup rapi.
2. **Loki sink masih rawan kehilangan log** — batch dihapus sebelum push berhasil, belum ada retry/backoff.
3. **Utilities kritis belum punya unit test** — `LokiStream`, `DistributedCircuitBreaker`, `token-blocklist`, `discovery`.
4. **Token revocation fail-open** — kalau Redis tidak tersedia, revoked token tetap diterima.
5. **`users.roleId` masih shared-DB** — perlu transisi ke event-driven agar ownership jelas.
6. **Service discovery statis** — HA hanya di gateway; downstream belum siap multi-instance.
7. **Belum ada metrics endpoint** — latency, error rate, circuit breaker state belum diekspos.

## Scope

### 1. Graceful Shutdown Menyeluruh

- Tinjau dan perbarui `SIGTERM`/`SIGINT` handler di setiap `apps/*/src/index.ts`.
- Pastikan ditutup secara berurutan:
  1. HTTP server stop (drain in-flight requests dengan timeout).
  2. DB pool end.
  3. Redis connections (ioredis) end/quit.
  4. BullMQ workers/queues close.
  5. WebSocket connections close.
  6. Loki stream flush & end.
- Buat helper `packages/shared/src/utils/graceful-shutdown.ts` untuk menyimpan daftar `close` hooks sekaligus memudahkan maintenance.

### 2. Penguatan Loki Sink

- Refactor `packages/logger/src/loki.ts` agar tidak menghapus batch dari buffer sebelum push sukses.
- Tambahkan retry dengan exponential backoff untuk push gagal (max 3 retries).
- Batasi ukuran buffer (max 1000 log) dan umur entry (TTL di buffer, misal 30 detik) untuk menghindari OOM saat Loki down lama.
- Pastikan `EmptyFile` false.

### 3. Unit Test untuk Utilities Kritis

Tambahkan test di folder `__tests__/` masing-masing modul:
- `packages/logger/src/__tests__/loki.test.ts` — batching, flush, retry, buffer limit.
- `apps/gateway/src/lib/__tests__/distributed-circuit-breaker.test.ts` — open/close/half-open, Redis state, fallback in-process.
- `packages/shared/src/utils/__tests__/token-blocklist.test.ts` — revoke, check, expired, Redis down behavior.
- `packages/shared/src/utils/__tests__/discovery.test.ts` — env override, default URL, error path.

### 4. Kaji Ulang Fail-Open Token Revocation

- Pilih kebijakan saat Redis tidak tersedia:
  - **A. Fail-closed**: return 503 Service Unavailable sampai Redis kembali.
  - **B. Fail-open tetap** tapi short TTL sangat pendek (mis. 60 detik) dan monitoring ketat.
  - **C. Lazy blocklist dengan DB fallback**: cek ke database jika Redis down.
- Default arsitek: **A** untuk konteks keamanan tinggi, kecuali user memilih B atau C.
- Update `packages/shared/src/middleware/auth.ts` dan `packages/shared/src/utils/token-blocklist.ts` sesuai keputusan.

### 5. Event-Driven Role Change

- `rbac-service` publish `UserRoleChanged` ke Redis event bus saat `changeUserRole` berhasil.
- `user-service` subscribe event `UserRoleChanged` dan update `users.roleId` sendiri.
- Setelah mekanisme event teruji, hapus update langsung `users.roleId` dari `rbac-service` (opsional, bisa bertahap).
- Pastikan event envelope memiliki `{ version, topic, payload, timestamp }`.
- Tambahkan retry/idempotency di consumer (misal `userId + roleId + updatedAt`).

### 6. Service Discovery & Downstream HA

- Evaluasi opsi:
  - **A.** Consul + service mesh (kompleks, fully dynamic).
  - **B.** Kubernetes DNS/Headless Service (kalau deploy ke k8s).
  - **C.** Traefik sebagai internal reverse proxy (lebih ringan, path-based).
  - **D.** Tetap env var, tapi tambahkan multi-URL comma-separated dengan round-robin di `packages/shared/src/utils/discovery.ts`.
- Untuk iterasi ini pilih **D** terlebih dahulu karena paling sedikit merusak existing flow.
- `docker-compose.ha.yml` diperluas dengan 2+ instance setiap downstream service + internal load balancer (opsional Traefik atau nginx upstream).

### 7. Metrics Endpoint

- Tambahkan `GET /v1/metrics` di gateway (atau per service) yang mengemas:
  - Request latency percentiles (p50, p95, p99).
  - Error rate per route/service.
  - Circuit breaker state (OPEN/CLOSED/HALF_OPEN).
  - Redis/DB connection pool stats.
  - Queue depth (BullMQ) jika ada.
- Format: Prometheus text exposition untuk kompatibilitas scraping.
- Simpan metrics di `apps/gateway/src/lib/metrics.ts` dengan in-memory ring buffer atau Redis aggregations.

## Checklist

- [x] Graceful shutdown helper dan update semua `apps/*/src/index.ts`.
- [x] Loki sink tidak kehilangan log, punya retry/backoff, dan batas buffer.
- [x] Unit test untuk `LokiStream`, `DistributedCircuitBreaker`, `token-blocklist`, `discovery`.
- [x] Keputusan fail-open/fail-closed token revocation dan implementasi.
- [x] Event `UserRoleChanged` publish dari `rbac-service` dan consume di `user-service`.
- [x] Multi-URL service discovery minimal untuk downstream HA.
- [x] Metrics endpoint `/v1/metrics` di gateway dengan format Prometheus.
- [x] Jalankan `bun run typecheck` dan `bun test` setelah perubahan.

## Keputusan yang Perlu Dipilih

### 1. Token revocation saat Redis down

- **A. Fail-closed (503)** — aman, tapi menurunkan availability saat Redis down.
- **B. Fail-open (tetap)** — availabilitas tinggi, risiko revoked token sementara diterima.
- **C. DB fallback** — paling konsisten, tapi menambah beban DB saat Redis down.

**Rekomendasi arsitek: A** — keamanan lebih penting daripada availability sementara.

### 2. Data ownership `users.roleId`

- **A. Event-driven** — `rbac-service` publish, `user-service` consume (membersihkan coupling).
- **B. User-service sebagai owner via internal API** — `rbac-service` call `PATCH /:id/role`.
- **C. Tetap shared-DB** — pertahankan kontrak saat ini.

**Rekomendasi arsitek: A** — jangka menengah paling sehat untuk ownership data.

### 3. Service discovery / downstream HA

- **A. Consul / Kubernetes / Traefik** — paling skalabel, tapi butuh infrastruktur ekstra.
- **B. Multi-URL env var + round-robin** — minimal viable, tidak merusak existing flow.
- **C. Gateway discovery client** — gateway memantau healthy instances secara aktif.

**Rekomendasi arsitek: B untuk iterasi ini, A saat pindah ke k8s.**

## Dampak

- Graceful shutdown yang rapi meningkatkan reliability deployment dan mengurangi in-flight request failures.
- Loki yang tidak kehilangan log meningkatkan observability di production.
- Unit test utilities kritis menurunkan risiko regression saat refactor.
- Fail-closed revocation meningkatkan keamanan meski Redis down.
- Event-driven role change membersihkan shared-DB coupling dan memudahkan skala horizontal.
- Multi-URL discovery mempersiapkan downstream HA tanpa perubahan arsitektur besar.
- Metrics endpoint memungkinkan alerting dan capacity planning.

## Referensi

- `docs/rules/01_architecture.md`
- `docs/roles/architect.md`
- `apps/*/src/index.ts`
- `packages/logger/src/loki.ts`
- `packages/shared/src/utils/token-blocklist.ts`
- `packages/shared/src/utils/discovery.ts`
- `packages/shared/src/middleware/auth.ts`
- `apps/gateway/src/lib/fetch.ts`
- `apps/rbac-service/src/modules/access/service/access.service.ts`
- `apps/user-service/src/modules/user/service/user.service.ts`
- `docker-compose.ha.yml`
- `nginx.conf`
