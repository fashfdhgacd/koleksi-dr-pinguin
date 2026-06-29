# Koleksi Dr. Pinguin Bokep, M.S.B.

Static HTML + JavaScript video gallery collection with admin panel.

## Project Structure (Clean Minimal)

```
koleksi-dr-pinguin/
├── admin.html          # Admin Converter untuk menambah video massal
├── index.html          # Gallery utama (public)
├── videos.json         # Semua data video (edit manual atau via Admin)
├── .gitignore
├── vercel.json         # Konfigurasi Vercel (pure static)
└── README.md
```

## Cara Menambah Video Baru (Menggunakan Admin)

1. Buka `admin.html` di browser (bisa dibuka langsung dari file atau setelah deploy).
2. Di textarea **Input Video Massal**, paste dengan format:
   - Baris 1: Judul video
   - Baris 2: Link embed (`/e/` atau `/d/`)
   - Ulangi untuk video berikutnya
3. Pilih **Kategori Default** jika diperlukan.
4. Klik tombol **Parse & Preview Video**.
5. Review hasil di bagian Preview.
6. Klik **Generate JSON** atau copy JSON yang dihasilkan.
7. Buka `videos.json`, paste/replace data baru (atau append).
8. Save `videos.json`.
9. Refresh `index.html` untuk melihat video baru.

**Tips**: Jangan tambah terlalu banyak sekaligus (maks 30-50 video per submit) agar tidak error.

## Testing Lokal

1. Clone repo ini.
2. Buka folder di terminal.
3. Jalankan server statis sederhana:
   ```bash
   npx serve .
   # atau
   python3 -m http.server 8000
   ```
4. Buka http://localhost:8000
5. Buka http://localhost:8000/admin.html untuk testing admin.

## Deploy / Redeploy ke Vercel (PENTING: Buat Project Baru)

Karena deployment lama rusak (404 DEPLOYMENT_NOT_FOUND), **jangan** coba redeploy ke project lama.

**Langkah-langkah:**

1. Pastikan kamu sudah login di [vercel.com](https://vercel.com).
2. Klik **Add New Project**.
3. Import Git Repository → pilih repo `koleksi-dr-pinguin`.
4. **Framework Preset**: Pilih **Other** (karena pure static).
5. Build Command: **kosongkan** (biarkan default atau isi ` `).
6. Output Directory: `.` (root).
7. Klik **Deploy**.
8. Setelah berhasil, Vercel akan kasih URL baru (misal `koleksi-dr-pinguin-xxx.vercel.app`).
9. Optional: Tambahkan custom domain di pengaturan project.

Setelah deploy pertama berhasil, setiap push ke branch `main` akan otomatis redeploy.

## Catatan Penting

- Semua data video hidup di `videos.json` (bukan database).
- Site ini **pure static** — tidak ada backend.
- Admin panel hanya membantu generate JSON, tidak langsung save ke server.
- Untuk production, selalu backup `videos.json` sebelum edit besar.
- Fitur seperti sitemap dan feature flags sudah dihapus untuk kesederhanaan dan stabilitas.

---

**Dibersihkan & Diperbaiki**: Juni 2026  
Branch cleanup: `fix/vercel-cleanup-june2026`

Site ini sekarang dalam kondisi minimal, bersih, dan siap deploy ulang di Vercel.