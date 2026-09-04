# Task 3: Refresh token langsung expired

- File: `src/utils/jwt.ts`, `src/modules/auth/service/auth.service.ts`, `src/modules/auth/controller/auth.controller.ts`
- `generateRefreshToken` mengembalikan `tmpExp` dalam detik (epoch seconds).
- Tapi di `saveRefreshToken` dan `rotateRefreshToken` disimpan sebagai `new Date(tmpExp)`, yang membuat `expiresAt` jadi tahun 1970.
- Perbaikan: gunakan `new Date(tmpExp * 1000)`.
