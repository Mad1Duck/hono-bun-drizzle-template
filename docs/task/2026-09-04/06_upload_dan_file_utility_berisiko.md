# Task 6: Upload & file utility berisiko

- File: `src/modules/storage/controller/storage.controller.ts`, `src/modules/storage/service/image.service.ts`, `src/utils/uploadthing.ts`, `src/utils/fileUtils.ts`
- Semua file dipaksa konversi ke WebP; `fileType` bisa undefined, lalu `type?.ext` menghasilkan ekstensi `undefined`.
- `uploadthing.ts` memakai `apiUrl: process.env.UPLOADTHING_SECRET` — seharusnya `token` (atau sesuai config UploadThing SDK v7).
- `fileUtils` menghasilkan `originalName` kosong kalau file tidak punya titik.
- Static handler `/public/*` tidak mengamankan path traversal dan tidak set `Content-Type`.
