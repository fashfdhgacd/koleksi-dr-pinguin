# Project Cloudflare Pages BARU

Akun Cloudflare tidak tersambung ke Grok, jadi project-nya kamu yang klik. Repo sudah siap.

## Buat project baru (jangan tempel ke project lama)

1. Buka https://dash.cloudflare.com → **Workers & Pages**
2. **Create** → **Pages** → **Connect to Git**
3. Pilih repo `fashfdhgacd/koleksi-dr-pinguin`
4. Setelan:
   - Project name: `koleksi-dr-pinguin-cf`
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(kosong)*
   - Build output directory: `/`
5. Save and Deploy

URL preview pertama biasanya:
`https://koleksi-dr-pinguin-cf.pages.dev`

Cek layout dulu di:
`https://koleksi-dr-pinguin-cf.pages.dev/preview-nonton.html`

## Domain .com
Jangan pindah nameserver sebelum Pages.dev sudah hijau.
Custom domains → add `koleksidrpinguin.com` + `www`.
Vercel project jangan dihapus dulu.

## Catatan
- Folder `api/` itu format Vercel. Di CF yang jalan folder `functions/`.
- `/v/id` diarahkan lewat `_redirects` ke `/api/watch`.
- Bot Telegram biarkan di Vercel/.site dulu.
