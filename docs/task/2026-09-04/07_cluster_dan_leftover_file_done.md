# Task 7: Cluster & leftover file

- File: `src/cluster.ts`
- `Number(process.env.CPU_CORES) ?? cpus().length` jadi `NaN` kalau env kosong, sehingga tidak ada worker yang di-fork.
- `import('@/index')` di worker tidak otomatis menjalankan `Bun.serve`.
- `test.ts` di root dan `src/tests/client.ts` kosong — sebaiknya dibersihkan.

## Status

- [x] Cek `src/cluster.ts` — tidak ditemukan di `apps/auth-service/src/`, issue `CPU_CORES`/`import('@/index')` sudah tidak ada
- [x] Cek `test.ts` root — tidak ditemukan
- [x] Cek `src/tests/client.ts` — tidak ditemukan di `apps/auth-service`
- [x] `bun test` di `apps/auth-service` pass (4 pass)
