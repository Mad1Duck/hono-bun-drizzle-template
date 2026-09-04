# Task 8: Zod middleware kurang tepat

- File: `src/middleware/zod.middleware.ts`
- Hanya memvalidasi `c.req.parseBody()` (form/multipart), bukan JSON.
- `SyntaxError` catch tidak akan terpicu oleh `parseBody`.
- Controller juga tidak pakai `c.get('parsedData')`, jadi hasil validasi cuma sebagai type guard, bukan sumber data.
