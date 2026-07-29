# Aissential E-Commerce (aissential)

Monorepo Turborepo: storefront guest-checkout (referensi UX: ncrsport.com) + admin panel + REST API.
Dokumen perancangan lengkap: [`docs/PERANCANGAN.md`](docs/PERANCANGAN.md).

| App | Stack | Port |
|---|---|---|
| `apps/web` | Next.js 15 (App Router) — storefront | 3000 |
| `apps/admin` | Refine + Vite + Ant Design — admin panel | 5173 |
| `apps/api` | NestJS + Prisma — REST API, Xendit, RajaOngkir (Komerce), Fonnte | 4000 |
| `packages/shared` | Types, DTO, util SKU | — |

## Setup

Prasyarat: Node 22+ (lihat `.nvmrc`), pnpm 9+ (`corepack enable`), PostgreSQL (lokal / Supabase / Neon).

```bash
# (opsional, kalau pakai nvm) samakan versi Node dengan .nvmrc
nvm use

pnpm install

# 1. Env
cp apps/api/.env.example apps/api/.env          # isi DATABASE_URL dkk
cp apps/web/.env.local.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env

# 2. Database
pnpm --filter api exec prisma migrate dev --name init
pnpm db:seed        # admin: admin@keytabee.com / admin123 (GANTI!)

# 3. Jalankan semua (web:3000, admin:5173, api:4000)
pnpm dev
```

## Develop lintas OS (Windows ↔ Linux/Mac)

Stack ini cross-platform (Node.js, pnpm, PostgreSQL, Prisma) — tidak ada dependency Windows-only, jadi setup di Linux/Mac sama persis dengan langkah di atas. Beberapa hal yang sudah disiapkan supaya aman pindah OS:

- `.gitattributes` — memaksa line ending `LF` di semua file text, menghindari noise diff CRLF/LF antar OS.
- `.nvmrc` — pin versi Node (`nvm use`) supaya semua mesin pakai versi yang sama.
- File `.env*` **tidak** ikut di-commit (lihat `.gitignore`) — di mesin baru, salin ulang dari `*.env.example` lalu isi manual (jangan commit isi credential asli).

```bash
git clone <url-repo>
nvm use            # jika pakai nvm
corepack enable
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env
pnpm --filter api exec prisma migrate dev
pnpm dev
```

## Webhook Xendit di lokal

Xendit butuh URL publik. Pakai tunnel:

```bash
cloudflared tunnel --url http://localhost:4000
# atau: ngrok http 4000
```

Set callback URL di dashboard Xendit → `https://<tunnel-url>/webhooks/xendit`,
dan samakan `XENDIT_CALLBACK_TOKEN` di `.env` dengan verification token di dashboard.

## Yang perlu diisi sebelum jalan penuh

- [ ] `DATABASE_URL` — Postgres (Supabase/Neon free tier oke)
- [ ] `XENDIT_SECRET_KEY` + `XENDIT_CALLBACK_TOKEN` — daftar di dashboard.xendit.co (test mode)
- [ ] `KOMERCE_API_KEY` — daftar di rajaongkir.komerce.id (**API lama rajaongkir deprecated**)
- [ ] `SHIPPING_ORIGIN_DISTRICT_ID` — ID kecamatan asal pengiriman (tanya owner)
- [ ] `FONNTE_TOKEN` + `OWNER_WA_NUMBER` — notifikasi WhatsApp
- [ ] Upload foto produk ke Supabase Storage + isi `ProductImage` (konvensi nama: lihat docs §4.3)
- [ ] Harga & berat final per produk (seed sekarang masih placeholder)

## Catatan implementasi penting

- **Stok di-hold saat checkout**, auto-release saat invoice expired (webhook + cron sweeper 10 menit).
- **Webhook Xendit idempotent** — transisi status pakai guard `updateMany where status=PENDING`.
- **Harga & ongkir selalu re-validasi server-side** — jangan pernah percaya angka dari client.
- `ShippingService` (Komerce): endpoint & mapping response masih **TODO verifikasi** dgn docs resmi begitu API key ada.
