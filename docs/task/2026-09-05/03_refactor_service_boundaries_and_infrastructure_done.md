# Refactor Service Boundaries dan Infrastruktur

## Tujuan

Membersihkan technical debt arsitektur yang tersisa setelah fondasi path dan database client diperbaiki. Fokus: pemisahan domain di `auth-service`, mengaktifkan `user-service`, membuat event bus siap scale, dan mempersiapkan service discovery.

## Latar Belakang

Dari review arsitektur sebelumnya ditemukan beberapa isu:

- `auth-service` terlalu banyak tanggung jawab: auth, storage, RBAC, email worker.
- `user-service` hanya punya `/health` padahal tabel `users` sudah ada dan seharusnya memiliki domain profil user.
- `packages/shared/src/stream/connector.ts` adalah in-memory `EventHub` yang hanya bekerja dalam 1 process.
- `gateway/src/config/services.ts` masih hardcoded ke env URL untuk setiap downstream service.

## Scope

### 1. Pemisahan domain di `auth-service`

Ekstrak `storage` dan `access` (RBAC) menjadi modul/service terpisah, atau minimal menyiapkan port/adapter sehingga bisa dipisah di masa depan tanpa mengubah contract API.

### 2. Mengaktifkan `user-service` untuk profil user

Pindahkan concern profil user ke `user-service`, memisahkan credentials (`auth-service`) dari profil (`user-service`).

### 3. Event bus lintas service

Ganti atau wrapping `EventHub` in-memory agar mendukung multi-instance (Redis Pub/Sub atau NATS).

### 4. Service discovery

Pertimbangkan mekanisme discovery untuk internal service URLs, mengurangi ketergantungan hardcoded env.

## Status

Completed (iterasi 1: user-service, event bus Redis Pub/Sub, gateway service discovery, port/adapter minimal untuk storage & access).

## Checklist

- [x] Audit semua modul di `auth-service` dan definisikan boundary masing-masing (auth, storage, access, email).
- [x] Buat port/adapter untuk `storage` dan `access` agar bisa diekstrak ke service terpisah.
- [ ] Pindahkan `storage` ke `apps/storage-service` atau `apps/file-service` (dijadwalkan iterasi berikutnya).
- [ ] Pindahkan `access` (RBAC) ke `apps/rbac-service` (dijadwalkan iterasi berikutnya).
- [ ] Pindahkan email worker dari `auth-service` ke `packages/workers/email.worker.ts` (dijadwalkan iterasi berikutnya).
- [x] Buat CRUD profil user di `apps/user-service`: `GET /v1/users/:id`, `PATCH /v1/users/:id` (dikembangkan sebelum `/me` karena belum ada auth middleware di user-service).
- [x] Pastikan `auth-service` dan `user-service` berbagi tabel `users` dari `@repo/database` dengan clear ownership.
- [x] Implementasi distributed `EventBus` adapter di `packages/shared/src/stream/connector.ts` (Redis Pub/Sub).
- [x] Update `ws.connector.ts` dan `sse.connector.ts` agar menggunakan event bus baru.
- [x] Tambah unit test untuk user route.
- [x] Rancang service discovery (env-based DNS) dan update `gateway/src/config/services.ts`.
- [x] Update `.env.example` untuk konfigurasi event bus dan service discovery.
- [x] Jalankan `bun run typecheck` dan `bun test` untuk semua app yang terkena.

## Keputusan yang Perlu Dipilih

### 1. RBAC / storage: service baru atau modul terpisah?

- **A.** Ekstrak ke service baru (`apps/rbac-service`, `apps/storage-service`) — lebih bersih tapi butuh konfigurasi gateway tambahan.
- **B.** Siapkan port/adapter di `auth-service` dulu, ekstrak nanti — lebih aman, minim perubahan.

**Rekomendasi default: B** untuk iterasi ini, agar tidak mengganggu API contract yang sudah ada.

### 2. Event bus: Redis Pub/Sub atau NATS?

- **A.** Redis Pub/Sub — Redis sudah ada di stack, minim dependency.
- **B.** NATS / Redpanda — lebih scalable untuk streaming dan multi-subscriber.

**Rekomendasi default: A** karena Redis sudah dipakai untuk rate limiter dan BullMQ.

### 3. Service discovery: env DNS atau static?

- **A.** Tetap static env + `docker-compose` / Kubernetes DNS naming.
- **B.** Consul / Eureka / etcd — overkill untuk skala saat ini.

**Rekomendasi default: A**, butuh dokumentasi konvensi naming di `.env.example`.

## Dampak

- Domain lebih jelas: `auth-service` untuk credential/token, `user-service` untuk profil.
- `auth-service` lebih ringan dan mudah di-scale.
- Event bus siap multi-instance horizontal scaling.
- Gateway lebih mudah dikonfigurasi di environment berbeda.

## Referensi

- `docs/rules/01_architecture.md` — package boundaries, API versioning, event contracts.
