# Task 6: Upload & file utility berisiko

- File: `src/modules/storage/controller/storage.controller.ts`, `src/modules/storage/service/image.service.ts`, `src/utils/uploadthing.ts`, `src/utils/fileUtils.ts`
- Semua file dipaksa konversi ke WebP; `fileType` bisa undefined, lalu `type?.ext` menghasilkan ekstensi `undefined`.
- `uploadthing.ts` memakai `apiUrl: process.env.UPLOADTHING_SECRET` — seharusnya `token` (atau sesuai config UploadThing SDK v7).
- `fileUtils` menghasilkan `originalName` kosong kalau file tidak punya titik.
- Static handler `/public/*` tidak mengamankan path traversal dan tidak set `Content-Type`.

## Status

- [x] Hanya konversi WebP untuk gambar; non-gambar/unknown balikin original dengan `mime` dan `ext` aman di `image.service.ts`
- [x] Update `storage.controller.ts` pakai `mime`/`ext` hasil `toWebp`
- [x] Fix `fileUtils.ts` supaya `originalName` tidak kosong kalau file tanpa titik
- [x] Fix `uploadthing.ts` pakai option `token` (bukan `apiUrl`)
- [x] Amankan `/public/*` handler di `app.ts`: reject `..`, 404 kalau tidak ada, set `Content-Type`
- [x] Buat `apps/auth-service/.env.example` untuk `AUTH_SERVICE_PORT`, `JWT_SECRET`, `UPLOADTHING_SECRET`
- [x] `bun test` di `apps/auth-service` pass (4 pass)
