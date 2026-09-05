# Gateway High Availability

Gateway saat ini adalah proses Bun tunggal (`apps/gateway/src/index.ts`) yang menjadi entry point seluruh trafik. Agar siap production, deploy gateway dengan high availability.

## Rekomendasi Deployment

### 1. Reverse Proxy / Load Balancer di Depan Gateway

- **nginx**, **traefik**, atau **HAProxy** menerima trafik publik dan meneruskannya ke beberapa instance gateway.
- Konfigurasikan health check ke `/v1/health/ready` agar instance yang degraded tidak menerima trafik.
- `/v1/health/live` cocok untuk liveness probe ( Kubernetes / Docker Swarm).

### 2. Multiple Gateway Instances

- Jalankan minimal 2 instance gateway dengan env yang identik.
- Gateway harus stateless:
  - `X-Request-Id` dibuat per request.
  - Circuit breaker state bersifat in-process; setiap instance punya breaker sendiri.
  - JWT secret, Redis, dan DB dibagi melalui env dan Redis/Postgres.

### 3. Circuit Breaker Terdistribusi (Opsional)

- Saat ini circuit breaker (`apps/gateway/src/lib/fetch.ts`) hanya in-process.
- Jika butuh shared state antar-instance, pertimbangkan:
  - Redis-backed breaker (key TTL `OPEN`/`HALF_OPEN`).
  - atau sidecar/coordination service.
- Trade-off: tambah latensi probe dan kompleksitas; perlu hati-hati dengan false positive saat satu instance overloading.

### 4. Graceful Shutdown

- Gateway sudah menangani `SIGTERM`/`SIGINT` dengan `server.stop()`.
- Load balancer harus mengirim health check fail sebelum SIGTERM agun trafik baru tidak masuk.

### 5. Observability

- Gunakan `/v1/health/ready` sebagai readiness probe.
- Monitor log gateway dengan `requestId` yang sama antar downstream untuk melacak distributed request.
- Tambahkan metrik (Prometheus / OpenTelemetry) untuk latensi per downstream dan circuit breaker state.

## Contoh Docker Compose

```yaml
version: "3.8"
services:
  gateway-1:
    build: .
    env_file: .env
    ports: ["3000:3000"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/v1/health/ready"]
      interval: 5s
      timeout: 3s
      retries: 3

  gateway-2:
    build: .
    env_file: .env
    ports: ["3001:3000"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/v1/health/ready"]
      interval: 5s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - gateway-1
      - gateway-2
```

## Checklist Operasional

- [ ] `/v1/health/ready` mengembalikan 200 hanya jika semua downstream siap.
- [ ] `/v1/health/live` mengembalikan 200 selama gateway dapat merespons.
- [ ] Load balancer memeriksa `/v1/health/ready` sebelum routing.
- [ ] Nginx/traefik retry hanya untuk method idempoten.
- [ ] Instance gateway dapat dinaikkan/turunkan tanpa kehilangan in-flight request.
