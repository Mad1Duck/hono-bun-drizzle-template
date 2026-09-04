# Task 7: Cluster & leftover file

- File: `src/cluster.ts`
- `Number(process.env.CPU_CORES) ?? cpus().length` jadi `NaN` kalau env kosong, sehingga tidak ada worker yang di-fork.
- `import('@/index')` di worker tidak otomatis menjalankan `Bun.serve`.
- `test.ts` di root dan `src/tests/client.ts` kosong — sebaiknya dibersihkan.
