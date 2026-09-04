# Task 2: Role check auth tidak berjalan semestinya

- File: `src/middleware/auth.middleware.ts`
- `_.find(findUser.roles, ...)` dipakai padahal `getUserById` mengembalikan `roles` sebagai string (`userRoles.name`), bukan array. `_.find` pada string akan iterasi per karakter, jadi cek role jadi tidak valid.
- `authenticationUser` nyari `"Admin"`, `authenticationAdministrator` nyari `"Owner"` — nama fungsi kebalik.
- `authenticationStoreOwner` cuma `return await next()` tanpa validasi apa pun.
- Middleware ini juga tidak dipakai di route mana pun, jadi endpoint sekarang belum terlindungi.
