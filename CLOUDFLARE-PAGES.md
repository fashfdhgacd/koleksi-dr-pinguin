# Deploy otomatis ke Cloudflare

Tiap push ke `main` → GitHub Action `Deploy Cloudflare` → Worker `koleksi-dr-pinguin`.

## Sekali saja: token

1. Cloudflare dashboard → My Profile → API Tokens → Create Token
2. Template **Edit Cloudflare Workers**
3. Copy token
4. GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   - `CLOUDFLARE_API_TOKEN` = token tadi
   - `CLOUDFLARE_ACCOUNT_ID` = `1ef0240f16747fd792f70e13c29790e0`
5. Actions → Deploy Cloudflare → Run workflow

Setelah secret terpasang, push ke `main` otomatis update:
https://koleksi-dr-pinguin.readmi559.workers.dev

Domain `.com` jangan dipindah dulu. Vercel biarkan nyala.
