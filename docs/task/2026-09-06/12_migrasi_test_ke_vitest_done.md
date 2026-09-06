# Task 12: Migrasi Test dari `bun:test` ke Vitest

- File: `package.json`, `turbo.json`, `vitest.workspace.ts` / `vitest.config.ts`, `apps/*/package.json`, `packages/*/package.json`, `**/__tests__/**/*.test.ts`
- Masalah: Saat ini semua test ditulis untuk `bun:test`. Mengganti runner ke Vitest memungkinkan konsistensi dengan ekosistem Vite, coverage bawaan, watch mode, dan monorepo workspace yang lebih terstruktur.

## Tujuan

Mengganti runner test dari `bun:test` ke `vitest` tanpa mengubah logika test, sehingga `bun test` dapat digantikan dengan `bunx vitest run` (atau `vitest run`) dan tetap lolos semua suite.

## Checklist

- [x] Pilih strategi monorepo Vitest: `vitest.workspace.ts` di root atau `vitest.config.ts` per package.
- [x] Tambahkan `vitest` (dan opsional `@vitest/coverage-v8`) ke root `devDependencies`.
- [x] Buat konfigurasi Vitest di root dengan:
  - `test.environment: 'node'`
  - `pool: 'forks'` untuk isolasi antar file test
  - `include` yang mencakup semua `**/__tests__/**/*.test.ts` (atau default sudah cukup)
  - alias path `@/` dan `@repo/*` agar sesuai dengan `tsconfig.json`
- [x] Tambahkan / ubah `test` script di root `package.json` menjadi `vitest run`.
- [x] Tambahkan `test:watch` dan `test:coverage` script jika dibutuhkan.
- [x] Sesuaikan `turbo.json` pipeline `test` jika ada, agar memanggil Vitest dan tidak `bun test`.
- [x] Update `apps/*/package.json` dan `packages/*/package.json` untuk menghapus `bun test` atau menambahkan `vitest` command spesifik jika ingin dijalankan per package.
- [x] Ganti semua import `import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "bun:test"` menjadi `import { describe, it, expect, ... } from "vitest"`.
- [x] Ganti mock API `bun:test` (`jest.fn`, `spyOn`, `mock`) ke `vi` dari `vitest`:
  - `jest.fn()` → `vi.fn()`
  - `spyOn(obj, 'method')` → `vi.spyOn(obj, 'method')`
  - reset/clear mocks menggunakan `vi.clearAllMocks()` / `vi.resetAllMocks()`
- [x] Tangani Bun-specific globals yang mungkin dipakai di test (mis. `Bun.file`, `Bun.write`), ganti dengan Node API atau mock.
- [x] Jalankan `bunx vitest run` di root; perbaiki error `import`, path alias, atau perbedaan `expect` behavior.
- [x] Pastikan `bun run typecheck` masih lolos setelah perubahan (hanya import `vitest` yang muncul di file test).
- [x] Update `README.md` bagian **Testing** dari `bun test` menjadi perintah Vitest (mis. `bunx vitest run`, `bunx vitest --watch`).

## Catatan

- Gunakan `vitest.workspace.ts` supaya tiap `apps/*` dan `packages/*` bisa punya `vitest.config.ts`-nya sendiri bila nanti diperlukan environment berbeda.
- Pastikan `vite-tsconfig-paths` atau alias manual tertulis supaya path mapping `@repo/*` dan `@/*` diterjemahkan Vitest dengan benar.
- Vitest dan `bun test` keduanya mendukung `describe`/`it`/`expect` Jest-style, sebagian besar migrasi hanya mengganti import dan mock API.

## Referensi

- `package.json` — script `test` saat ini tidak ada; perlu ditambahkan.
- `turbo.json` — pipeline test dan dependensi antar package.
- `packages/shared/src/utils/__tests__/discovery.test.ts` — contoh file test yang sudah mengikuti pola `bun:test`.
