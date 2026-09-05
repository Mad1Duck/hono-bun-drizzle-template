# Implementasi Phase 1: analytics-service untuk Chart Data

## Tujuan

Membuat service baru `apps/analytics-service` yang menyediakan API untuk chart **Kedatangan per Matra dan Moda**. Phase 1 masih mengambil data dari 3rd party Siasati, kemudian diteruskan ke frontend dengan format yang siap untuk chart. Service ini dirancang agar mudah beralih ke database internal di Phase 2 tanpa mengubah contract API.

## Latar Belakang

- Backend saat ini terdiri dari `auth-service`, `notification-service`, `user-service`, dan `gateway`.
- Frontend saat ini mengonsumsi 3rd party API Siasati langsung dari kode lama dengan mekanisme cache file.
- Solusi baru memindahkan fetching dan transformasi ke backend, sehingga kredensial 3rd party tidak perlu diekspos ke client dan cache lebih mudah dikelola di Redis.

## Scope Phase 1

- Buat `apps/analytics-service` sebagai service Hono baru.
- Implementasi `SiasatiAdapter` sebagai sumber data utama.
- Implementasi `RedisCacheAdapter` untuk menyimpan respons Siasati dengan TTL.
- Definisikan port `ProductionSource` agar nanti bisa diganti ke `DbAdapter` tanpa ubah business logic.
- Buat endpoint `GET /v1/analytics/arrivals` dengan kontrak `ApiResponse<T>`.
- Daftarkan route baru di `gateway` dan tambahkan `ANALYTICS_SERVICE_URL` ke env.
- Tambah unit test untuk endpoint analytics.

## Checklist

- [ ] Buat `apps/analytics-service/package.json` dan `tsconfig.json`.
- [ ] Buat `apps/analytics-service/src/app.ts` dan `src/index.ts`.
- [ ] Buat `apps/analytics-service/src/config/env.ts` untuk `SIASATI_*` dan `REDIS_*`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/ports/production-source.port.ts`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/adapters/siasati.adapter.ts`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/adapters/cache.adapter.ts`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/service/analytics.service.ts`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/controller/analytics.controller.ts`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/route/analytics.route.ts`.
- [ ] Buat `apps/analytics-service/src/modules/analytics/validator/analytics.validator.ts` (Zod).
- [ ] Buat `packages/shared/src/types/analytics.ts` untuk shared DTO.
- [ ] Tambah route `analytics` di `apps/gateway/src/routes/index.ts`.
- [ ] Tambah `ANALYTICS_SERVICE_URL` di `apps/gateway/src/config/env.ts` dan `.env.example`.
- [ ] Tambah `ANALYTICS_SERVICE_URL` di `apps/gateway/src/config/services.ts`.
- [ ] Tambah `apps/analytics-service/src/test/health.test.ts`.
- [ ] Tambah `apps/analytics-service/src/modules/analytics/__tests__/analytics.route.test.ts`.
- [ ] Jalankan `bun install` untuk workspace baru.
- [ ] Jalankan semua test agar tidak ada yang fail.

## API Contract

```
GET /v1/analytics/arrivals
  ?eventId=123
  &provinceId=32
  &from=2025-04-21
  &to=2025-05-20
  &granularity=day   # day | hour
```

Response `ApiResponse<T>`:

```json
{
  "data": {
    "labels": ["2025-04-21", "2025-04-22"],
    "datasets": [
      { "label": "darat", "data": [...] },
      { "label": "laut", "data": [...] },
      { "label": "udara", "data": [...] },
      { "label": "ka", "data": [...] }
    ]
  },
  "error": null,
  "meta": {
    "code": 200,
    "status": "SUCCESS",
    "message": "OK",
    "version": "v1"
  }
}
```

## Keamanan

- Kredensial Siasati (`SIASATI_USERNAME`, `SIASATI_PASSWORD`) disimpan di environment variables.
- Jangan log header `Authorization` atau payload mengandung PII.
- Cache Redis dengan TTL default 5 menit.

## Referensi

- Desain lengkap: `docs/new-feature/analytics-service.md`
