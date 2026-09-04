# Task 3: Refresh token langsung expired

- File: `src/utils/jwt.ts`, `src/modules/auth/service/auth.service.ts`, `src/modules/auth/controller/auth.controller.ts`
- `generateRefreshToken` mengembalikan `tmpExp` dalam detik (epoch seconds).
- Tapi di `saveRefreshToken` dan `rotateRefreshToken` disimpan sebagai `new Date(tmpExp)`, yang membuat `expiresAt` jadi tahun 1970.
- Perbaikan: gunakan `new Date(tmpExp * 1000)`.

## Status

- [x] Ganti `new Date(tmpExp)` menjadi `new Date(tmpExp * 1000)` di `apps/auth-service/src/modules/auth/controller/auth.controller.ts` (login & refresh)
- [x] Verifikasi `bun test` masih pass (4 pass)
