# CLAUDE.md

Konteks kerja untuk Claude Code di repo ini. Overview stack & setup dasar ada di [README.md](README.md) — dokumen ini isinya tambahan khusus untuk develop di **Windows** + demo online lewat **ngrok**.

## Develop di Windows

Stack-nya cross-platform (Node, pnpm, PostgreSQL, Prisma) — tidak ada dependency Windows-only untuk kerja sehari-hari (edit kode, `pnpm dev`, migrasi Prisma). Tapi khusus untuk skrip demo online (lihat di bawah), pakai tool Linux-only (`fuser`, `ss`, `pg_isready`) — jadi kalau mau pakai skrip itu apa adanya, **install WSL2 (Ubuntu)**, jangan andalkan Git Bash biasa (tidak lengkap tool-nya).

```powershell
# Prasyarat (kerja harian, tanpa WSL juga bisa)
winget install OpenJS.NodeJS.LTS      # atau nvm-windows, samakan versi dgn .nvmrc
corepack enable
winget install Git.Git

git clone <url-repo>
cd e-commerce-keytabe
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env
pnpm --filter api exec prisma migrate dev
pnpm dev
```

PostgreSQL: paling gampang pakai Supabase/Neon (free tier, tinggal isi `DATABASE_URL`) daripada install Postgres native di Windows.

## Demo online lewat ngrok — sudah otomatis, pakai `scripts/demo/`

**Jangan setup ngrok manual dari nol** — repo ini sudah punya skrip yang otomatis: nyalain 3 tunnel ngrok (api/web/admin), update ke-3 `.env` dengan URL tunnel yang baru, sinkronkan URL gambar produk lama di database ke tunnel baru, lalu nyalain `pnpm dev`. Semua dalam 1 perintah.

File-file terkait:
- [`scripts/demo/ngrok-tunnels.yml`](scripts/demo/ngrok-tunnels.yml) — definisi 3 tunnel (api:4000, web:3000, admin:5173). Di-commit ke git, **tidak ada token di dalamnya**, aman.
- `~/.config/ngrok/ngrok.yml` — config global **di luar repo**, isinya authtoken ngrok pribadi. Ini yang bikin token tidak pernah ke-commit — jangan pindahkan token ke file manapun di dalam repo.
- [`scripts/demo/start.sh`](scripts/demo/start.sh) — nyalain semuanya.
- [`scripts/demo/stop.sh`](scripts/demo/stop.sh) — matikan semuanya.

### Setup awal (sekali saja per mesin)

```bash
# Di WSL2/Linux/Mac
winget install ngrok.ngrok   # atau: sudo snap install ngrok / download dari ngrok.com
ngrok config add-authtoken <token-dari-dashboard-ngrok.com>   # otomatis simpan ke ~/.config/ngrok/ngrok.yml
```

### Jalankan demo

```bash
bash scripts/demo/start.sh
```

Script ini otomatis:
1. Matikan sisa proses demo lama (`stop.sh`).
2. Cek Postgres jalan di `localhost:5433`.
3. Nyalakan 3 tunnel ngrok sekaligus.
4. Update `FRONTEND_URL`, `ADMIN_URL`, `API_PUBLIC_URL` di `apps/api/.env`; `NEXT_PUBLIC_API_URL` di `apps/web/.env.local`; `VITE_API_URL` di `apps/admin/.env` — otomatis diisi URL tunnel yang baru (URL ngrok plan gratis **acak tiap restart**).
5. Update URL gambar produk lama di tabel `ProductImage` ke domain tunnel baru.
6. Nyalakan `pnpm dev` (web + admin + api).
7. Cetak ke-3 URL publik di akhir.

Matikan demo:

```bash
bash scripts/demo/stop.sh
```

### Kalau Windows tanpa WSL2

Skrip `start.sh`/`stop.sh` pakai `fuser`, `ss`, `pg_isready` yang tidak ada di Git Bash bawaan Windows — akan gagal di tengah jalan. Opsinya:
- **Disarankan**: install WSL2 (`wsl --install` di PowerShell admin), clone/jalankan repo dari dalam WSL, jalankan `scripts/demo/start.sh` dari sana persis seperti Linux.
- Kalau tetap mau native Windows tanpa WSL: jalankan `ngrok start --all --config "%USERPROFILE%\.config\ngrok\ngrok.yml" --config scripts\demo\ngrok-tunnels.yml` manual, lalu isi 5 env di atas manual dari URL yang muncul di dashboard `http://127.0.0.1:4040`, restart `pnpm dev` sendiri. Lebih ribet & rawan lupa satu env — WSL2 jauh lebih aman.

### Catatan penting

- **Jangan pernah taruh authtoken ngrok di file manapun di dalam repo** (termasuk file baru) — sudah pernah dicek, seluruh riwayat git repo ini bersih dari token, pertahankan begitu dengan selalu pakai `~/.config/ngrok/ngrok.yml` (di luar repo) untuk token.
- Kalau tunnel API mati di tengah demo, webhook Xendit (pembayaran) & callback Fonnte otomatis gagal masuk — pastikan proses `start.sh` tetap hidup selama demo berlangsung.
- Browser Chromium (Brave/Chrome) kadang nahan halaman interstitial ngrok free plan — kode sudah antisipasi ini lewat header `ngrok-skip-browser-warning` di [lib/api.ts](apps/web/src/lib/api.ts), jadi tidak perlu klik "Visit Site" manual tiap request API dari kode (cuma sekali pas buka halaman pertama kali di browser).
