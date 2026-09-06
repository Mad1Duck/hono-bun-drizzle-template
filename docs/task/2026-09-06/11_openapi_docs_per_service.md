# Task 11: OpenAPI API Documentation per Service

- File: `apps/*/src/routes/*.ts`, `apps/gateway/src/app.ts`, `packages/shared/src/apiResponse.ts`, `packages/validation/src/*.ts`
- Masalah: Backend belum memiliki API documentation yang terpusat. Setiap service memiliki Zod validator dan route, tetapi belum ada OpenAPI spec yang bisa dibaca frontend atau konsumen eksternal.

## Tujuan

Menyediakan API documentation otomatis dari Zod schema di setiap `apps/*`, lalu meng-aggregatenya di `apps/gateway` agar frontend bisa melihat semua contract dari satu tempat.

## Checklist

- [x] Pilih tools: `@asteasolutions/zod-to-openapi` (sudah ada di `auth-service`) atau `@hono/zod-openapi`, plus UI `@scalar/hono-api-reference` atau `@hono/swagger-ui`.
- [x] Buat OpenAPI registry/scheme untuk `auth-service` (`/v1/auth/*`).
- [x] Buat OpenAPI registry/scheme untuk `user-service` (`/v1/users/*`).
- [x] Buat OpenAPI registry/scheme untuk `rbac-service` (`/v1/rbac/*`).
- [x] Buat OpenAPI registry/scheme untuk `notification-service` (`/v1/notifications/*`).
- [x] Buat OpenAPI registry/scheme untuk `storage-service` (`/v1/storage/*`).
- [x] Agregasikan spec per service di `apps/gateway` menjadi satu OpenAPI (`/v1/docs` atau `/docs`).
- [x] Tampilkan UI docs (Scalar/Swagger) di `gateway`.
- [x] Pastikan semua input (body, query, params) tervalidasi Zod dan tercermin di docs.
- [x] Update `.env.example` jika ada env var baru.
- [x] Verifikasi `bun run typecheck` dan `bun test`.
- [x] Update `README.md` mengenai cara akses `/docs`.

## Referensi

- `apps/auth-service/package.json` — sudah mengandung `@asteasolutions/zod-to-openapi` dan `@hono/swagger-ui`.
- `docs/rules/01_architecture.md` — API contract `ApiResponse<T>`.
