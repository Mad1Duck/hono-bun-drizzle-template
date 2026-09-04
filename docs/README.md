# Panduan Pengerjaan Task

## Konvensi Nama File

Setiap task disimpan di folder `docs/task/YYYY-MM-DD/` dengan format:

```
NN_deskripsi_singkat[_done].md
```

- `NN` — nomor urut (contoh: `01`, `02`, …)
- `deskripsi_singkat` — deskripsi singkat isu atau fitur, pakai snake_case
- `_done` — **suffix opsional** yang ditambahkan saat task sudah selesai semua checklist-nya
- `.md` — ekstensi wajib
- Tanggal dalam path menunjukkan kapan task dibuat atau teridentifikasi.

Contoh aktif: `docs/task/2026-09-04/08_zod_middleware_kurang_tepat.md`  
Contoh selesai: `docs/task/2026-09-04/01_transformasi_nomor_telepon_email_salah_done.md`

## Isi Tiap Task

Tiap file task berisi:

1. Judul task atau ringkasan masalah.
2. Detail isu yang ditemukan *(jangan langsung memperbaiki kode kecuali diminta)*.
3. File dan baris yang terkait.
4. Petunjuk perbaikan atau pertanyaan yang harus dijawab.

## Cara Menggunakan Rule Prompt

Sebelum mengerjakan task, AI wajib membaca README ini dan memilih **satu rule prompt** yang paling relevan dengan task tersebut. Masukkan prompt tersebut sebagai konteks awal, lalu baru kerjakan task.

---

### Prompt 1: Memahami konfigurasi repo, CI, dan tooling

```text
Ini konfigurasi repo: package.json, config build, dan workflow CI.
Jangan usulkan perubahan apa pun. Jawab ringkas dan sebut nama file.

1. Perintah persis apa yang dijalankan CI, berurutan? Mana yang
   memblokir merge dan mana yang sekadar informasi?
2. Unit test: runner apa, pola file mana yang diambil, bagaimana
   menjalankan SATU file saja?
3. E2E: runner apa, butuh prasyarat apa (server, build, browser,
   env var, port, database)? Bagaimana menjalankan satu spec saja?
4. Ada build step yang harus jalan sebelum test? Ada artefak
   ter-cache yang bisa membuat hasil test menyesatkan?
5. Konvensi apa yang terlihat dipaksakan oleh tooling — formatter,
   lint rule kustom, path alias, batasan struktur folder?
6. File apa yang JANGAN disentuh karena hasil generate atau
   dikelola tooling?
```

### Prompt 2: Memahami alur data dan kodebase

```text
Kamu membantuku memahami kodebase ini, bukan memperbaikinya.
Jangan sarankan perubahan apa pun.

Jawab ringkas:
1. Titik masuk data: endpoint, consumer, cron, webhook — mana saja?
2. Titik keluar: DB, HTTP keluar, queue, cache — mana saja?
3. Untuk satu request tulis paling penting, urutkan lapisan yang dilewati
   dari masuk sampai persist.
4. Di lapisan mana kepemilikan data (tenant/user) diperiksa?
5. Bagian mana yang berjalan konkuren atau asinkron?
6. Apa 3 asumsi implisit yang kalau salah akan merusak sistem ini?

Sebut nama file untuk tiap jawaban.
```

### Prompt 3: Analisis konkurensi, idempotensi, dan konsistensi

```text
Ini kode dari <file>. Jangan tulis perbaikan.

Untuk tiap jalur tulis di kode ini, jawab:

1. Kalau dua request/worker menjalankan ini BERSAMAAN untuk entitas yang sama,
   urutan interleaving mana yang menghasilkan keadaan salah?
   Tulis urutannya langkah per langkah.

2. Kalau proses mati TEPAT DI ANTARA dua statement, keadaan mana yang
   tertinggal setengah jadi? Tabel mana yang jadi tidak konsisten?

3. Kalau operasi ini dijalankan DUA KALI dengan input identik,
   hasilnya sama atau berbeda? Apa yang menjamin itu?

4. Jaminan urutan apa yang diasumsikan kode ini, dan apa yang
   sebenarnya dijamin oleh transport/DB-nya?

Kalau jawabannya "aman", sebutkan mekanisme spesifik yang mengamankannya
(constraint, lock, transaksi) — jangan bilang aman tanpa menunjuk mekanismenya.
```

> Ganti `<file>` pada Prompt 3 dengan path file yang sedang dianalisis.
