# Task 8: Zod middleware kurang tepat

- File: `src/middleware/zod.middleware.ts`
- Hanya memvalidasi `c.req.parseBody()` (form/multipart), bukan JSON.
- `SyntaxError` catch tidak akan terpicu oleh `parseBody`.
- Controller juga tidak pakai `c.get('parsedData')`, jadi hasil validasi cuma sebagai type guard, bukan sumber data.

## Status

- [x] Ganti `c.req.parseBody()` jadi `c.req.json()` di `packages/validation/src/index.ts`
- [x] `SyntaxError` dari `c.req.json()` sekarang bisa tertangkap sebagai `INVALID_JSON`
- [x] `auth.controller.ts` pakai `c.get('parsedData')` untuk `register`, `login`, `refreshToken`, `logout`
- [x] `auth.route.ts` tambahkan `validate(refreshTokenSchema)` di `/refresh` dan `/logout`
- [x] `bun test` di `apps/auth-service` pass (4 pass)
