# Task 1: Transformasi nomor telepon/email salah

- File: `src/utils/formater.ts` baris 6
- `emailSchema.safeParse(phoneNumber)` mengembalikan object `SafeParseReturnType`, bukan error-nya. Jadi `if (error)` selalu truthy dan input email pun ikut diformat jadi aneh (`62dmin@example.com`).
- Perbaikan: cek `!error.success` atau destruct `const { success }`.

## Status

- [x] Perbaiki `emailSchema.safeParse` di `apps/auth-service/src/utils/formater.ts`
- [x] Tambahkan unit test `apps/auth-service/src/utils/test/formater.test.ts`
- [x] Verifikasi `bun test` (4 pass)
