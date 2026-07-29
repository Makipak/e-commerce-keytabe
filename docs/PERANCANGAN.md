# Perancangan Sistem E-Commerce Aissential (aissential)

> Dokumen perancangan teknis. Status: disepakati 8 Juli 2026.
> Referensi UX: ncrsport.com (guest checkout). Payment: Xendit. Ongkir: RajaOngkir (Komerce).

---

## 1. Ringkasan Keputusan

| Komponen | Keputusan |
|---|---|
| Storefront | Next.js (App Router, SSR/ISR) |
| Admin panel | Refine + Vite + Ant Design |
| Backend API | NestJS (REST) |
| Database / ORM | PostgreSQL + Prisma |
| Struktur repo | Monorepo Turborepo (pnpm workspace) |
| Payment gateway | Xendit (Invoice API + webhook) |
| Ongkir | RajaOngkir via Komerce API |
| Auth pembeli | **Tidak ada** — full guest checkout |
| Auth admin | JWT, khusus owner/staff di admin panel |
| Notifikasi | WhatsApp (Fonnte) ke pembeli & owner |
| Storage foto | Supabase Storage (free tier) |
| Hosting | Web: Vercel. API: TBD (disiapkan Dockerfile). DB: Supabase/Neon |

## 2. Arsitektur

```
                ┌──────────────┐
   Pembeli ───► │ apps/web     │ Next.js (SSR/ISR, SEO, katalog, checkout)
                └──────┬───────┘
                       │ REST (HTTPS)
   Owner ─────► ┌──────┴───────┐        ┌──────────────┐
   (admin)      │ apps/api     │ ◄────► │ PostgreSQL   │
        ┌──────►│ NestJS+Prisma│        └──────────────┘
        │       └──┬───┬───┬───┘
 ┌──────┴─────┐    │   │   └── Fonnte (WhatsApp notif)
 │ apps/admin │    │   └────── Komerce/RajaOngkir (ongkir)
 │ Refine+Vite│    │
 └────────────┘    └── Xendit (create invoice + webhook callback)
```

Prinsip: **semua business logic di NestJS**. Next.js murni rendering + data fetching. Admin murni konsumsi REST API.

## 3. Struktur Monorepo

```
e-commerce/
├── apps/
│   ├── web/        # Next.js storefront (port 3000)
│   ├── admin/      # Refine admin panel (port 5173)
│   └── api/        # NestJS REST API (port 4000)
├── packages/
│   └── shared/     # Types, DTO, konstanta status, util SKU
├── docs/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 4. Model Produk & Konvensi SKU

### 4.1 Aturan

- **Beda print/desain = produk terpisah.** Beda warna/ukuran = varian.
- Setiap produk punya ≥1 varian. Produk tanpa pilihan (mis. cap) → 1 varian `One Size`.
- Size fase 1: **S, M, L, XL** (+ `OS` untuk one-size).
- Foto nempel di level **produk + warna** (`colorCode` di ProductImage), bukan per size — hindari duplikasi.

### 4.2 Format SKU

```
AIS-{KATEGORI}{NO_DESAIN}-{WARNA}-{SIZE}

AIS-TSH1-BLK-M   → T-shirt desain 1, Black, M
AIS-HDE1-BLU-L   → Hoodie desain 1, Blue, L
AIS-SWT2-BLU-S   → Crewneck desain 2 (Human Brilliance), Blue, S
AIS-CAP1-BLK-OS  → Cap desain 1, Black, One Size
```

Kategori: `TSH` t-shirt · `HDE` hoodie · `SWT` crewneck · `PLO` polo · `JKT` jacket · `CAP` cap.
Warna: `BLK` · `WHT` · `BLU` · `GRY` · `NVY`.

### 4.3 Konvensi nama file foto

```
{SKU tanpa size}_{view}_{type}.png
AIS-HDE1-BLU_front_model.png
AIS-HDE1-BLU_back_flat.png
```

`view`: front | back · `type`: model | flat. Flat → thumbnail katalog; model → galeri/hover halaman produk.

### 4.4 Draft katalog dari asset

| Produk | Colorway | Foto tersedia |
|---|---|---|
| Cap (2 desain?) | Black | front/back × model/flat |
| Hoodie desain box-logo | Blue, Black(?) | front/back × model/flat |
| Hoodie desain tags | Black, Blue | front/back × model/flat |
| Hoodie basic | Dark Grey | front/back × model/flat |
| Jacket "Human Brilliance" | White | front/back × model/flat |
| Polo | Navy | front/back × model/flat |
| Crewneck "404" | Black | front/back × model/flat |
| Crewneck "Human Brilliance" | Blue | front/back × model/flat |
| T-shirt desain 1 | Black | front/back × model/flat |
| T-shirt desain 1 & 2 | White | front/back × model/flat |

> TODO konfirmasi owner: pemisahan desain final, harga per produk, berat per item, range size per produk.

## 5. Skema Database (Prisma)

Skema lengkap di `apps/api/prisma/schema.prisma`. Inti:

```prisma
model Product {
  id          String   @id @default(cuid())
  slug        String   @unique          // "hoodie-box-logo"
  name        String
  description String?
  category    Category                  // TSH | HDE | SWT | PLO | JKT | CAP
  basePrice   Int                       // IDR, dalam rupiah utuh
  weightGram  Int                       // untuk ongkir
  isActive    Boolean  @default(true)
  variants    ProductVariant[]
  images      ProductImage[]
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  sku       String  @unique             // AIS-HDE1-BLU-L
  colorCode String                      // BLK | WHT | BLU | GRY | NVY
  colorName String                      // "Black"
  size      Size                        // S | M | L | XL | OS
  price     Int?                        // null → pakai basePrice
  stock     Int     @default(0)
  product   Product @relation(...)
  @@unique([productId, colorCode, size])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  colorCode String                      // foto per warna, bukan per size
  url       String
  view      String                      // front | back
  type      String                      // model | flat
  sortOrder Int     @default(0)
}

model Order {
  id            String      @id @default(cuid())
  orderNumber   String      @unique     // KTB-20260708-0001
  status        OrderStatus @default(PENDING)
  // Guest info (tidak ada akun user; userId nullable disiapkan utk fase 2)
  userId        String?
  guestName     String
  guestPhone    String                  // wajib — kanal notifikasi WA
  guestEmail    String?
  // Alamat (ID wilayah dari API Komerce)
  address       String
  provinceId    Int
  cityId        Int
  districtId    Int
  postalCode    String?
  // Uang (semua IDR)
  subtotal      Int
  shippingCost  Int
  total         Int
  courier       String                  // "jne", "sicepat", ...
  courierService String                 // "REG", "YES", ...
  waybill       String?                 // no. resi, diisi admin
  // Xendit
  xenditInvoiceId  String?  @unique
  xenditInvoiceUrl String?
  paidAt        DateTime?
  expiredAt     DateTime?               // basis auto-release stok
  items         OrderItem[]
  createdAt     DateTime    @default(now())
}

model OrderItem {
  id         String @id @default(cuid())
  orderId    String
  variantId  String
  sku        String                     // snapshot
  name       String                     // snapshot nama produk + varian
  price      Int                        // snapshot harga saat beli
  qty        Int
}

model AdminUser {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  name         String
  role         String @default("owner") // owner | staff
}

enum OrderStatus { PENDING PAID PROCESSING SHIPPED COMPLETED CANCELLED EXPIRED }
enum Size { S M L XL OS }
enum Category { TSH HDE SWT PLO JKT CAP }
```

Catatan desain:
- `OrderItem` menyimpan **snapshot** sku/nama/harga — histori order tidak berubah saat produk diedit.
- Harga `Int` rupiah utuh (bukan float/decimal) — IDR tidak punya sen.
- `Order.userId` nullable dari awal → fase 2 (akun user) tinggal diisi tanpa migrasi sakit.

## 6. State Machine Order & Kebijakan Stok

```
PENDING ──(webhook paid)──► PAID ──► PROCESSING ──► SHIPPED ──► COMPLETED
   │
   ├──(invoice expired)──► EXPIRED   → stok dikembalikan
   └──(admin cancel)─────► CANCELLED → stok dikembalikan
```

**Kebijakan stok: hold saat checkout.**
1. Saat create order: kurangi stok dalam **transaksi Prisma** dengan guard
   `UPDATE ProductVariant SET stock = stock - qty WHERE id = ? AND stock >= qty`
   — kalau affected rows = 0 → tolak (race condition dua pembeli barang terakhir).
2. Invoice Xendit dibuat dengan expiry **24 jam**.
3. Webhook `invoice.expired` / cron sweeper → status EXPIRED + stok dikembalikan.

## 7. Flow Checkout & Xendit

```
1. Client (Next) POST /orders
   { items: [{variantId, qty}], guestName, guestPhone, address..., courier, courierService }
2. API dalam 1 transaksi:
   a. Validasi & re-fetch harga dari DB (JANGAN percaya harga dari client)
   b. Re-hitung ongkir ke Komerce (jangan percaya ongkir dari client)
   c. Kurangi stok (guard stock >= qty)
   d. Buat Order status PENDING + orderNumber
3. API create Xendit Invoice:
   external_id = orderNumber, amount = total, expiry 24 jam,
   success_redirect_url = /track/{orderNumber}
4. Response → client redirect ke invoice_url (halaman pembayaran Xendit:
   VA/QRIS/e-wallet/retail — semua di-handle Xendit)
5. Xendit → POST /webhooks/xendit
   a. Verifikasi header x-callback-token === XENDIT_CALLBACK_TOKEN
   b. IDEMPOTENT: jika order sudah PAID, return 200 tanpa efek samping
      (Xendit bisa retry callback)
   c. status=PAID → set paidAt, kirim WA ke pembeli + owner
   d. status=EXPIRED → set EXPIRED + kembalikan stok
6. Pembeli tracking di /track/{orderNumber} (public, tanpa login)
```

Dev lokal: webhook butuh URL publik → pakai `cloudflared tunnel` / ngrok.
Environment: test mode dulu (`xnd_development_...`), production key saat launch. **Akun Xendit owner harus diverifikasi bisnis — proses beberapa hari, mulai daftar sekarang.**

## 8. Ongkir — RajaOngkir (Komerce)

⚠️ RajaOngkir bermigrasi ke **Komerce** (`rajaongkir.komerce.id`). API lama (`api.rajaongkir.com`) deprecated. Daftar akun Komerce untuk API key. Verifikasi endpoint terbaru saat implementasi.

Flow di checkout:
1. `GET /shipping/provinces` → dropdown provinsi (proxy + cache di API kita)
2. `GET /shipping/cities?provinceId=` → kota · `GET /shipping/districts?cityId=` → kecamatan
3. `POST /shipping/cost { districtId, weightGram, courier }` → daftar layanan + tarif
4. Berat = Σ (weightGram varian × qty). Estimasi awal: kaos ~250g, polo ~300g, crewneck/hoodie ~500–650g, jacket ~700g, cap ~150g.
5. Origin pengiriman: **TODO tanya owner** (kecamatan asal).

Respons wilayah & tarif di-cache (Redis nanti / in-memory dulu) — data wilayah jarang berubah.

## 9. API Contract (ringkas)

Public (storefront):
```
GET  /products?category=&search=&page=      daftar produk aktif
GET  /products/:slug                        detail + variants + images
POST /orders                                create order + invoice → { orderNumber, invoiceUrl }
GET  /orders/track/:orderNumber             status order (public tracking)
GET  /shipping/provinces|cities|districts   data wilayah
POST /shipping/cost                         cek ongkir
POST /webhooks/xendit                       callback Xendit (token-guarded)
```

Admin (JWT `Authorization: Bearer`):
```
POST   /auth/login                          → { accessToken }
CRUD   /admin/products, /admin/products/:id/variants, /images
GET    /admin/orders?status=&page=
PATCH  /admin/orders/:id/status             PROCESSING/SHIPPED(+waybill)/CANCELLED
GET    /admin/dashboard                     ringkasan penjualan
```

Format list response: `{ data: T[], total: number }` + query `_start/_end` atau `page/pageSize` — kontrak yang dipahami data provider Refine.

## 10. Notifikasi WhatsApp (Fonnte)

Trigger: order PAID → WA ke pembeli (konfirmasi + link tracking) dan owner (order baru). Status SHIPPED → WA resi ke pembeli. Implementasi: service `NotificationModule`, kirim via HTTP API Fonnte, fire-and-forget + log gagal (jangan blokir flow order karena WA gagal).

## 11. Environment Variables

```
# apps/api/.env
DATABASE_URL=postgresql://...
JWT_SECRET=
XENDIT_SECRET_KEY=xnd_development_...
XENDIT_CALLBACK_TOKEN=
KOMERCE_API_KEY=
FONNTE_TOKEN=
OWNER_WA_NUMBER=628xxx
SHIPPING_ORIGIN_DISTRICT_ID=
FRONTEND_URL=http://localhost:3000

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

# apps/admin/.env
VITE_API_URL=http://localhost:4000
```

## 12. Roadmap

**Fase 1 (MVP):** katalog + search sederhana, halaman produk (varian size/warna), cart client-side (localStorage, re-validate server saat checkout), checkout guest (Xendit + Komerce), tracking publik, WA notif, admin: CRUD produk/varian/foto + manajemen order + update resi.

**Fase 2:** akun user (order history), kode promo/diskon, laporan penjualan, review produk, wishlist, OTP WA.

**Bukan scope:** multi-vendor, multi-currency, multi-gudang.
