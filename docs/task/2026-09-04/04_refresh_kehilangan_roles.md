# Task 4: Refresh kehilangan roles

- File: `src/utils/jwt.ts`
- Payload refresh token tidak menyertakan `roles`, sedangkan `refreshToken` controller membuat access token baru dari decoded refresh token.
- Akibatnya setelah refresh, access token baru punya `roles: undefined` dan auth/authorization bisa jebol.
