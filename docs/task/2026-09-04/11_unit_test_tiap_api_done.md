# Buat Unit Test untuk Setiap API

## Latar Belakang

Saat ini hampir tidak ada unit test untuk endpoint API. Tes yang tersedia hanya satu utilitas: `apps/auth-service/src/utils/test/formater.test.ts`. Runner yang dipakai adalah Bun (`bun:test`), terlihat dari `import { describe, it, expect } from "bun:test"`, dan setiap app dijalankan dengan `bun`.

## Endpoint yang Ditemukan

### `auth-service` (`/v1/...`)

File pendukung:
- `apps/auth-service/src/app.ts` (mount `/v1`)
- `apps/auth-service/src/routes/index.ts`
- `apps/auth-service/src/modules/auth/route/auth.route.ts`
- `apps/auth-service/src/modules/storage/route/storage.route.ts`
- `apps/auth-service/src/modules/access/route/access.route.ts`
- `apps/auth-service/src/routes/health.ts`

Endpoint:
- `POST /v1/auth/login`
- `POST /v1/auth/register`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/storage/upload`
- `GET /v1/roles`
- `POST /v1/roles`
- `PATCH /v1/roles/:id`
- `DELETE /v1/roles/:id`
- `GET /v1/roles/:roleId/permissions`
- `POST /v1/roles/:roleId/permissions`
- `DELETE /v1/roles/:roleId/permissions/:permissionId`
- `PATCH /v1/roles/:roleId/users/:userId`
- `GET /v1/permissions`
- `POST /v1/permissions`
- `DELETE /v1/permissions/:id`
- `GET /v1/health`

### `notification-service` (`/v1/...`)

File pendukung:
- `apps/notification-service/src/app.ts` (mount `/v1`)
- `apps/notification-service/src/routes/index.ts`
- `apps/notification-service/src/modules/notification/route/notification.route.ts`
- `apps/notification-service/src/routes/health.ts`

Endpoint:
- `POST /v1/notifications`
- `GET /v1/notifications/:userId`
- `PATCH /v1/notifications/:notificationId/read`
- `GET /v1/health`

### `user-service`

File pendukung:
- `apps/user-service/src/app.ts`
- `apps/user-service/src/routes/health.ts`

Endpoint:
- `GET /health`

### `gateway`

File pendukung:
- `apps/gateway/src/routes/index.ts`
- `apps/gateway/src/routes/health.ts`
- `apps/gateway/src/proxy/*.proxy.ts`

Endpoint:
- `GET /health`
- `GET /health/live`
- `GET /health/ready`

Sisanya adalah proxy ke service lain (`/auth/*`, `/notifications/*`, `/roles/*`, `/permissions/*`) dengan middleware authentication, sehingga test dapat fokus ke proxy routing dan middleware.

## Tugas

Buat unit test untuk setiap endpoint menggunakan konvensi Bun test runner. File test diletakkan di folder `__tests__` atau `test` dekat modulnya, mengikuti pola `*.test.ts` (lihat `apps/auth-service/src/utils/test/formater.test.ts`). Setiap test minimal harus:

1. Mengimpor instance `Hono` / `app` terkait.
2. Memanggil `app.request(...)` untuk memicu HTTP request.
3. Memverifikasi status code dan body response.
4. Memisahkan skenario sukses dan error (misal validasi Zod gagal, token tidak valid, resource tidak ditemukan).
5. Menggunakan mock database/queue bila perlu agar test tidak memerlukan server nyata.

## Status

Completed.

## Checklist

- [x] `POST /v1/auth/login`
- [x] `POST /v1/auth/register`
- [x] `POST /v1/auth/refresh`
- [x] `POST /v1/auth/logout`
- [x] `POST /v1/storage/upload`
- [x] `GET /v1/roles`
- [x] `POST /v1/roles`
- [x] `PATCH /v1/roles/:id`
- [x] `DELETE /v1/roles/:id`
- [x] `GET /v1/roles/:roleId/permissions`
- [x] `POST /v1/roles/:roleId/permissions`
- [x] `DELETE /v1/roles/:roleId/permissions/:permissionId`
- [x] `PATCH /v1/roles/:roleId/users/:userId`
- [x] `GET /v1/permissions`
- [x] `POST /v1/permissions`
- [x] `DELETE /v1/permissions/:id`
- [x] `GET /v1/health` (auth-service)
- [x] `POST /v1/notifications`
- [x] `GET /v1/notifications/:userId`
- [x] `PATCH /v1/notifications/:notificationId/read`
- [x] `GET /v1/health` (notification-service)
- [x] `GET /health` (user-service)
- [x] `GET /health` (gateway)
- [x] `GET /health/live` (gateway)
- [x] `GET /health/ready` (gateway)
- [x] `gateway` proxy `/auth/*`, `/notifications/*`, `/roles/*`, `/permissions/*` beserta middleware auth
