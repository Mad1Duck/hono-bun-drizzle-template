# Task 5: Konfigurasi server & middleware di `index.ts` bermasalah

- File: `src/index.ts`
- JWT middleware `.use('/auth/*', jwt({ secret: 'it-is-very-secret' }))` pakai secret hardcoded dan path-nya salah (`/auth/*` tidak menangkap `/api/auth/*`, karena auth route mounted di `/api/auth`).
- CORS `origin: 'localhost'` tidak valid untuk Hono (harus URL/regex/array); `allowMethods` cuma POST/GET/OPTIONS, sehingga PUT/PATCH/DELETE terblokir.
- `timeout(5000)` dipasang di `.use('/api', ...)` — ini hanya match exact `/api`, bukan `/api/*`, jadi tidak berfungsi untuk endpoint.
- Port default 8080, tapi `README.md` bilang 3000.
- Dua instance `createBunWebSocket()` dipanggil terpisah (`src/index.ts` dan `src/websocket/index.ts`), kemungkinan besar WebSocket handler tidak terkoneksi dengan `Bun.serve`.
