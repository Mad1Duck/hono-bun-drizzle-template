# Roles

Folder ini berisi persona yang harus dipakai AI sesuai domain task.

## Cara memilih role

1. Sebelum mengerjakan task, baca `docs/SETUP.md`.
2. Pilih **satu role** yang paling cocok dengan task.
3. AI wajib mengikuti persona, focus, dan constraint di file role tersebut.
4. Jika task melibatkan beberapa domain, pilih role utama lalu sebut cross-domain concern di catatan.

## Daftar role

- `backend.md` — Backend Engineer (default untuk task di repo ini)
- `frontend.md` — Frontend Engineer
- `devops.md` — DevOps / Infrastructure
- `qa.md` — QA / Testing
- `architect.md` — Solutions / Systems Architect (untuk arsitektur, komunikasi antar service, dan design trade-off)

## Menambah role baru

Jika muncul domain baru, buat file `docs/roles/<nama_role>.md` dengan format yang sama. Update file ini.
