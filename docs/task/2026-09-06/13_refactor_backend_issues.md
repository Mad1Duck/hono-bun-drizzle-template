# Task 13: Refactor & Backend Quality Issues

- File: `apps/auth-service/src/utils/hashing.ts`, `apps/auth-service/src/app.ts`, `apps/storage-service/src/app.ts`, `apps/gateway/src/stream/connector/ws.connector.ts`, `packages/shared/src/rateLimiter.ts`, `apps/auth-service/src/modules/auth/__tests__/auth.route.success.test.ts`, `turbo.json`, `.env.example`, `apps/*/src/config/env.ts`, test files
- Masalah: Berdasarkan analisa migrasi Vitest dan arsitektur, ditemukan beberapa masalah kualitas, lock-in Bun, mocking, dan konfigurasi pipeline yang perlu ditangani.

## Tujuan

Menghilangkan ketergantungan runtime Bun yang tidak perlu, memperbaiki perilaku rate limiter saat testing, memperbaiki timeout test login, membersihkan mocking pattern, dan merapikan konfigurasi Turbo serta environment variables.

## Checklist

- [ ] **Kurangi lock-in Bun API**
  - Refactor `Bun.password.hash/verify` di `apps/auth-service/src/utils/hashing.ts` ke `bcrypt` (Node) atau abstraction yang bisa di-swap.
  - Ganti `Bun.file` di `apps/auth-service/src/app.ts` static handler menjadi `node:fs` / `fs/promises` atau `serveStatic` yang tidak bergantung Bun.
  - Ganti `Bun.serve` di semua `apps/*/src/index.ts` menjadi entry point yang kompatibel Node (atau abstraksi server factory).
  - Refactor `import { ServerWebSocket } from "bun"` dan `hono/bun` di `apps/gateway/src/stream/connector/ws.connector.ts` menjadi adapter yang bisa pakai transport Node/WebSocket lain.
  - Update `vitest.setup.ts` sehingga shim Bun tidak lagi diperlukan setelah refactor.

- [ ] **Lazy-instantiate Redis pada rate limiter**
  - Ubah `packages/shared/src/rateLimiter.ts` agar tidak membuat `new Redis(...)` di top-level module.
  - Buat instance Redis pertama kali `checkRateLimit` / `resetRateLimit` dipanggil, atau inject Redis client dari luar.
  - Pastikan test Vitest tidak lagi mencoba konek ke `127.0.0.1:6379` saat modul di-load.

- [ ] **Perbaiki `auth.route.success.test.ts` timeout**
  - Hapus `vi.mock("@repo/shared", async (importOriginal) => ...)` yang memuat modul asli.
  - Mock langsung `checkRateLimit` dan `resetRateLimit` tanpa `importOriginal`, atau perbaiki `vi.mock("ioredis")` agar benar-benar intercept (termasuk `packages/shared/src/rateLimiter.ts`).
  - Pastikan `POST /login returns tokens` lolos tanpa timeout.

- [ ] **Bersihkan pattern mocking di test files**
  - Hapus `importOriginal() as any` di `auth.route.success.test.ts`.
  - Gunakan `vi.mock` langsung untuk modul yang dipakai (`@repo/shared`, `ioredis`, `bun`) tanpa load modul asli.
  - Hapus mock `ioredis` duplikat/tidak efektif jika rate limiter sudah di-lazy-instantiate.

- [ ] **Rapikan pipeline `test` di Turbo**
  - Tentukan apakah `test` dijalankan hanya di root (`vitest run`) atau tiap package punya script `test`.
  - Tambahkan `test: "vitest run"` ke `apps/*/package.json` dan `packages/*/package.json` jika ingin `turbo run test` berjalan, atau filter `turbo` agar hanya root yang menjalankan test.
  - Pastikan `turbo.json` task `test` sinkron dengan keputusan di atas.

- [ ] **Sinkronkan `.env.example` dan validasi env**
  - Bandingkan semua `process.env` yang dibaca dengan `.env.example`.
  - Pastikan setiap service memiliki `src/config/env.ts` untuk validasi dan default (contoh: `apps/gateway/src/config/env.ts`).
  - Tambahkan env yang belum terdaftar ke `.env.example` dengan keterangan.

- [ ] **Bersihkan dead code & duplikasi pasca migrasi Vitest**
  - Cari sisa import/from `bun:test` di seluruh repo.
  - Hapus pattern `mock.module` bekas jika masih ada.
  - Hapus file/fungsi `import` yang tidak terpakai setelah migrasi.
  - Jalankan `bun run typecheck` dan `bun run test` setelah cleanup.

## Catatan

- Kerjakan tiap sub-task secara terpisah; prioritas tertinggi adalah memperbaiki rate limiter dan timeout test login.
- Setelah refactor Bun API, `Bun`-shim di `vitest.setup.ts` bisa dihapus.
- Setiap perubahan wajib diikuti `bun run typecheck` dan `bun run test`.

## Referensi

- `docs/rules/01_architecture.md` — konvensi env, DRY, testing, package boundaries.
- `packages/shared/src/rateLimiter.ts` — sumber masalah Redis eager connect.
- `apps/auth-service/src/modules/auth/__tests__/auth.route.success.test.ts` — file test yang masih timeout.
- `vitest.setup.ts` — tempat Bun shim saat ini.
