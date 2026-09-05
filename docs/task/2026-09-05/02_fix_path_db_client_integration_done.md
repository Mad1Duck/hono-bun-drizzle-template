# Fix Integrasi Path Prefix dan Database Client

## Tujuan

Memperbaiki fondasi integrasi antar service sebelum fitur baru (seperti `analytics-service`) ditambahkan. Issue yang ditangani: path prefix `/v1` tidak konsisten antara Gateway dan downstream service, serta `packages/database/client.ts` membuat koneksi pool saat import.

## Latar Belakang

Dari review arsitektur ditemukan beberapa critical issue:

- **Path mismatch**: Gateway mem-mount semua route di `/${API_VERSION}` dan `createProxy` meneruskan path lengkap (termasuk `/v1`). Namun `notification-service` dan `user-service` tidak mem-mount route di `/v1`, sehingga proxy mengarah ke path yang tidak ada di downstream.
- **Database client initialization**: `packages/database/client.ts` membuat `Pool` saat modul di-import, memakai `process.env.DATABASE_URL!` tanpa validasi. Ini bisa membuat startup crash atau salah memuat env. `gateway` juga seharusnya tidak perlu import DB client.

## Scope

1. Standarisasi prefix `/v1` di `notification-service` dan `user-service`.
2. Perbaiki `packages/database/client.ts` agar aman dan lazy.
3. Pastikan `gateway` tidak mengimpor `@repo/database`.
4. Update health check path di `gateway/src/routes/health.ts` agar konsisten.
5. Update unit test yang terkena perubahan.

## Status

Completed.

## Checklist

- [x] `apps/notification-service/src/app.ts`: mount `routes` di `/${API_VERSION}`.
- [x] `apps/user-service/src/app.ts`: mount `routes` di `/${API_VERSION}` dan pindahkan `/health` ke `routes/index.ts`.
- [x] `apps/notification-service/src/routes/index.ts`: tambahkan `.route('/health', health)` jika belum ada.
- [x] `apps/user-service/src/routes/index.ts`: mount `/health` di bawah `/` sebelum prefix di-apply.
- [x] `packages/database/client.ts`: validasi `DATABASE_URL` dan buat `Pool` secara lazy (factory function).
- [x] Pastikan `apps/gateway` tidak mengimpor `@repo/database`.
- [x] Update `apps/gateway/src/routes/health.ts`: health check ke `http://<service>/v1/health` atau sesuai keputusan path.
- [x] Update `.env.example` jika diperlukan.
- [x] Jalankan `bun test` di `apps/notification-service`, `apps/user-service`, `apps/gateway`.
- [x] Pastikan `bun run typecheck` lulus untuk semua app yang terkena.

## Keputusan yang Perlu Dipilih

### 1. Health check path

Opsi:

- **A.** Setiap service expose `/health` di root tanpa `/v1`, dan `gateway/health.ts` memanggil `http://<service>/health`. Ini lebih sederhana untuk health probe.
- **B.** Setiap service expose `/v1/health`, dan `gateway/health.ts` memanggil `http://<service>/v1/health`. Ini lebih konsisten tapi health check tidak bergantung pada API version.

**Rekomendasi default: A** untuk health, agar `isServiceHealthy` tetap memanggil `/health` tanpa prefix.

### 2. Database client initialization

Opsi:

- **A.** Buat factory `createDb()` yang dipanggil tiap service, dengan validasi `DATABASE_URL`.
- **B.** Tetap singleton, tapi buat `getPool()` dan `getDb()` lazy + validasi.

**Rekomendasi default: B** karena minim perubahan di downstream service.

## Dampak

- Gateway health check kembali akurat untuk `notification-service`.
- `user-service` siap dikembangkan lebih lanjut dengan prefix yang konsisten.
- `packages/database` lebih aman di startup dan tidak akan crash di service yang tidak butuh DB (gateway).

## Referensi

- Hasil review arsitektur sebelumnya di thread.
- `docs/rules/01_architecture.md` — API versioning, graceful shutdown, package boundaries.
