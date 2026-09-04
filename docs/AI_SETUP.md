# AI Setup & Workflow

File ini adalah panduan singkat untuk AI. User hanya perlu menyuruh "baca `AI_SETUP.md`" atau "kerjakan task NN", dan AI wajib mengikuti pola di bawah.

## 1. Perintah yang dipahami

| Perintah user | Arti | Yang harus AI lakukan |
|---------------|------|-----------------------|
| `implement task NN` / `kerjakan task NN` / `selesaikan task NN` | Mengerjakan/mengimplementasikan task | Baca task file → analisa kode terkait → edit source → verify → checklist ijo |
| `create task <deskripsi>` / `buat task` | Membuat task baru | Jangan langsung mengerjakan. Buat file task di `docs/task/YYYY-MM-DD/NN_deskripsi_singkat.md`. |
| `verdict` / `review` / `verdict menurutmu` | Review kode | Jangan edit source. Beri analisis + rekomendasi saja. |
| `baca docs/AI_SETUP.md` | Setup awal | Baca file ini, `docs/README.md`, lalu siap menerima instruksi berikutnya. |

## 2. Role dan konteks

### Memilih role

- Sebelum mengerjakan task, baca `docs/roles/README.md` dan pilih **satu role** yang paling sesuai domain task.
- Default untuk repo ini adalah `docs/roles/backend.md`.
- AI harus memakai persona, focus, dan constraint di file role tersebut sampai task selesai.
- Jika user tidak menyebut role, tanyakan atau pakai `backend.md`.

### Memory / ingatan project

- AI wajib mengingat struktur repo, aturan `docs/rules/`, dan daftar task yang sedang/sudah dikerjakan.
- Setiap kali ada perubahan signifikan pada project (struktur folder, stack baru, convention baru, task selesai), simpan/update ke memory project.
- Jika user menyuruh "ingat ..." atau "simpan ke memory", gunakan `create_memory` dengan tag `project_setup`, `workflow`, atau `roles`.

## 3. Workflow mengerjakan task

### Saat diminta `implement task NN`:

1. **Baca setup dulu** — `docs/AI_SETUP.md`, `docs/README.md`, dan `docs/roles/<role>.md`.
2. **Baca task file** — `docs/task/YYYY-MM-DD/NN_deskripsi.md`.
3. **Baca rule prompt yang relevan** — pilih Prompt 1/2/3 dari `docs/README.md` jika diperlukan.
4. **Analisa source file yang terkait** — jangan asumsi, baca baris yang ditunjuk task.
5. **Implementasikan perubahan** — pakai `edit` / `multi_edit` / `write_to_file`, bukan copy-paste kode ke chat.
6. **Update/tambah unit test** — setiap perubahan API harus diikuti unit test yang dapat diaudit; pastikan test lama masih relevan.
7. **Verifikasi minimal** — jalankan type check dan unit test terkait.
8. **Update task file** — ubah checklist dari `[ ]` menjadi `[x]` (✅ ijo) untuk item yang selesai.
9. **Update todo list** — tandai task sebagai `completed` via `todo_list`.

### Saat diminta `create task`:

1. **Jangan mengerjakan/implementasi apapun kecuali diminta secara eksplisit**.
2. **Tentukan nomor urut berikutnya** dari `docs/task/YYYY-MM-DD/`.
3. **Buat file** dengan format:
   ```
   docs/task/YYYY-MM-DD/NN_deskripsi_singkat.md
   ```
   Contoh: `docs/task/2026-09-04/11_auth_rate_limit_broken.md`
4. **Isi file dengan template**:
   - `# Task NN: <judul>`
   - `- File: <path file terkait>`
   - `- Deskripsi masalah`
   - `- Checklist:`
     - `[ ] Langkah 1`
     - `[ ] Langkah 2`
   - `- Referensi`
5. **Tambahkan ke todo list** sebagai `pending` jika user ingin dikerjakan nanti.

## 4. Template task wajib

Setiap file task harus ada bagian **Checklist** dengan checkbox Markdown. Contoh:

```markdown
# Task 11: Contoh task

- File: `src/utils/example.ts`
- Masalah: deskripsi singkat.

## Checklist

- [ ] Analisa kode terkait
- [ ] Implementasi perbaikan
- [ ] Update atau tambah unit test (terutama untuk perubahan API)
- [ ] Verifikasi type check / test
- [ ] Update dokumentasi jika perlu
```

## 5. Aturan checklist warna ijo

- Awal task: semua item pakai `- [ ]` (kotak kosong).
- Setelah selesai: ubah menjadi `- [x]` (GitHub/VS Code akan render centang hijau).
- Jangan tandai item selesai kalau belum diverifikasi.
- Tambahkan `## Status` di atas task file kalau semua checklist sudah `[x]`:
  ```markdown
  ## Status

  - [x] Completed
  ```

## 6. Hal yang dilarang

- Jangan usulkan perubahan arsitektur besar kalau user cuma minta implementasi satu task.
- Jangan langsung edit kode kalau user bilang `create task` saja.
- Jangan keluarkan kode di chat; selalu pakai tool edit.
- Jangan buat file baru kecuali memang dibutuhkan task.
- Jangan lupakan role yang sedang aktif; tetap konsisten dengan persona role.
