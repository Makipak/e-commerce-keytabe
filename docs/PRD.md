# PRD — Desain Frontend Storefront Keytabee (aissential)

> Dokumen ini untuk brief desain (dipakai dengan Claude untuk menghasilkan desain UI/UX).
> Scope: **storefront pembeli** (`apps/web`) saja. Admin panel (`apps/admin`, Refine+Ant Design) **di luar scope** dokumen ini.
> Referensi acuan: [ncrsport.com](https://ncrsport.com) — khususnya alur guest checkout & tone visual.

---

## 1. Ringkasan Produk

Keytabee (brand: **aissential**) adalah brand apparel/streetwear (hoodie, t-shirt, crewneck, polo, jacket, cap) yang jual langsung ke konsumen lewat storefront online. Belanja **tanpa akun** (full guest checkout) — pembeli isi nama, WA, alamat, pilih ongkir, lalu bayar via Xendit (VA/QRIS/e-wallet/retail). Setelah bayar, pembeli dapat notifikasi WhatsApp + bisa cek status pesanan lewat halaman tracking publik.

Stack teknis storefront: Next.js 15 (App Router, SSR/ISR), Tailwind CSS. Konsumsi REST API dari `apps/api` (NestJS). Semua business logic (harga, ongkir, stok) divalidasi di server — frontend murni presentasi + fetch data.

**Kondisi saat ini:** halaman sudah fungsional (katalog, detail produk, cart, checkout, tracking) tapi stylingnya masih sangat dasar/generic (Tailwind default, belum ada identitas visual). Dokumen ini adalah brief untuk **desain ulang tampilan** — bukan mengubah struktur data atau flow bisnis yang sudah disepakati di [`PERANCANGAN.md`](./PERANCANGAN.md).

---

## 2. Target Pengguna

- Anak muda/dewasa muda Indonesia, familiar belanja online lewat Instagram/TikTok Shop, ekspektasi checkout cepat tanpa ribet bikin akun.
- Mayoritas akses dari **mobile** (asumsikan mobile-first, desktop sebagai enhancement).
- Sensitif terhadap: kejelasan stok/ukuran (barang streetwear sering limited), kepercayaan (foto produk jelas, status pesanan transparan), kecepatan checkout.

---

## 3. Arah Desain (Brand Direction)

### 3.1 Gaya: **Minimalis Premium**

Bukan streetwear-gelap-agresif, bukan juga playful-colorful. Target rasanya seperti label fashion premium yang tenang dan percaya diri — banyak whitespace, tipografi bersih, foto produk jadi pusat perhatian (bukan UI yang ramai). Pikirkan Uniqlo / COS / Aesop, tapi tetap terasa "streetwear" lewat pemilihan foto (model shot) dan sedikit ketegasan di tipografi besar.

Prinsip:
- **Foto produk adalah hero** — UI harus minim gangguan visual di sekitarnya.
- **Whitespace generous** — jangan takut kosong; kepadatan rendah = kesan premium.
- **Tipografi sebagai identitas utama** — karena belum ada logo/brand mark yang kuat, gunakan tipografi besar & rapi untuk membangun karakter brand.
- **Warna netral dominan, aksen dipakai hemat** — aksen hanya untuk CTA penting, badge stok, status.
- **Motion halus** — transisi fade/slide lembut, hover state subtle (scale kecil, tidak norak).

### 3.2 Referensi: ncrsport.com

Ambil dari referensi ini: struktur guest checkout yang ringkas (tidak minta akun), kejelasan pilihan varian (warna/ukuran) di halaman produk, dan copy yang to-the-point. **Tidak perlu meniru tone visualnya** (ncrsport lebih sport/bold) — cukup pola interaksi & information architecture-nya. Tone visual mengikuti arah minimalis premium di atas.

### 3.3 Palet Warna (usulan — belum ada brand palette resmi)

Karena brand belum punya palet resmi, berikut usulan yang selaras dengan foto produk yang sudah ada (garmen black/white/blue/grey/navy):

| Token | Hex | Pemakaian |
|---|---|---|
| `background` | `#FAFAF8` | Latar utama (off-white hangat, bukan putih steril) |
| `surface` | `#FFFFFF` | Card, modal, area foto produk |
| `surface-muted` | `#F2F0EB` | Section alternatif, skeleton loading |
| `ink` (teks utama) | `#171717` | Heading, teks penting, tombol utama |
| `ink-muted` (teks sekunder) | `#6B6B65` | Deskripsi, label, harga sekunder |
| `border` | `#E6E3DC` | Divider, outline input/kartu |
| `accent` (aksen brand) | `#A8501F` (clay/terracotta hangat) | CTA hover, tag "Baru"/"Diskon", link aktif — dipakai **hemat** |
| `success` | `#3A6B4A` | Status PAID/SHIPPED/COMPLETED |
| `warning` | `#B8862E` | Status PENDING, stok menipis |
| `danger` | `#B3352C` | Stok habis, CANCELLED/EXPIRED |

> Catatan: ini adalah usulan awal, bukan keputusan final brand. Kalau nantinya owner sudah punya arahan warna sendiri, palet ini tinggal disesuaikan — struktur token (background/ink/accent/status) tetap dipakai.

### 3.4 Tipografi

- **Font utama:** Geist Sans (open-source, gratis via `next/font/google`, modern & cocok untuk gaya minimalis-premium). Fallback: Inter.
- Satu keluarga font untuk heading & body, dibedakan lewat **weight & tracking**, bukan mixing font — ciri khas gaya minimalis.
- Heading besar (hero, nama produk di halaman detail): weight 600–700, tracking sedikit rapat (`-0.02em`), ukuran besar (32–56px desktop).
- Body/UI text: weight 400–500, ukuran 14–16px, line-height lega (1.5–1.6) untuk kesan lapang.
- Harga: sedikit ditonjolkan (weight 500, ukuran sama/lebih besar dari nama produk) — pembeli harus bisa scan harga secepat nama barang.

### 3.5 Layout & Grid

- Container max-width **1280–1440px** (lebih lega dari `max-w-6xl`/1152px yang dipakai sekarang) — beri margin kiri-kanan lega di desktop.
- Grid produk: 2 kolom di mobile, 3 di tablet, 4 di desktop — foto **aspect-square**, gap lega (≥16px mobile, ≥24px desktop).
- Vertical rhythm konsisten: jarak antar section besar (64–96px desktop, 40–56px mobile) — bagian dari kesan "premium, tidak sesak".

### 3.6 Fotografi Produk

Aset foto sudah mengikuti konvensi: per warna, kombinasi **front/back** × **model/flat**.
- Katalog/listing → pakai foto `flat` (produk saja, latar bersih) sebagai thumbnail konsisten.
- Halaman detail → galeri dengan foto `model` sebagai foto utama (menonjolkan gaya pakai), `flat` front/back sebagai pelengkap.
- Semua foto di kartu/galeri pakai rasio 1:1, object-fit cover, latar `surface-muted` saat gambar loading/belum ada.

---

## 4. Peta Halaman (Scope Desain)

| # | Halaman | Route | Prioritas |
|---|---|---|---|
| 1 | Homepage / Katalog (+ filter kategori, search) | `/`, `/?category=`, `/?search=` | **Tinggi** |
| 2 | Detail Produk | `/products/[slug]` | **Tinggi** |
| 3 | Cart | `/cart` | **Tinggi** |
| 4 | Checkout (alamat, ongkir, ringkasan → redirect Xendit) | `/checkout` | **Tinggi** |
| 5 | Order Tracking (publik) | `/track/[orderNumber]` | Sedang |
| 6 | Global: Header, Footer, Empty/Loading/Error states, 404 | semua halaman | **Tinggi** |

Di luar 6 halaman ini (mis. halaman "Tentang", size guide berdiri sendiri) tidak wajib, tapi boleh diusulkan sebagai enhancement opsional (lihat §7).

---

## 5. Spesifikasi Desain per Halaman

### 5.1 Header (global, sticky)

- Logo/wordmark "keytabee" kiri, nav kanan: link Katalog, ikon cart dengan badge jumlah item.
- Search bar: bisa collapse jadi ikon di mobile, expand di desktop (produk-produk streetwear biasa dicari by nama desain).
- Sticky dengan backdrop blur tipis saat scroll (sudah ada, pertahankan pola ini, perhalus visualnya).

### 5.2 Homepage / Katalog

- Opsional hero section ringkas di atas grid katalog (1 banner besar: highlight koleksi/desain terbaru) — sejalan dengan gaya minimalis, hero tidak perlu carousel ramai, cukup 1 gambar statis + headline singkat + CTA "Lihat Koleksi".
- Filter kategori sebagai pill/chip horizontal (TSH, HDE, SWT, PLO, JKT, CAP — label Indonesia: T-Shirt, Hoodie, Crewneck, Polo, Jacket, Cap), state aktif jelas (ink background, bukan sekadar border).
- Grid produk: foto (aspect-square), nama produk, harga. Tambahkan badge kecil untuk "Stok Terbatas" atau "Habis" langsung di kartu (saat ini info stok baru muncul di halaman detail — pertimbangkan tampilkan lebih awal supaya user tidak kecewa setelah klik masuk).
- Empty state ("Belum ada produk") didesain, bukan teks polos — ilustrasi/icon minimal + copy ramah.

### 5.3 Detail Produk

- Layout 2 kolom desktop (galeri kiri, info kanan) — sudah sesuai, fokus ke *polish*:
  - Galeri: foto utama besar, thumbnail strip di bawah, navigasi prev/next (sudah ada, perhalus interaksi/transisi).
  - Swatch warna: tampilkan sebagai chip warna asli (bukan hanya teks nama warna) supaya user langsung ambil keputusan visual.
  - Pilihan ukuran: tombol grid, state disabled untuk stok habis (dengan strikethrough, sudah ada polanya — pertahankan, perjelas kontras visual disabled vs available).
  - Info stok menipis ("Sisa X pcs!") — desain sebagai badge warning kecil dekat pilihan ukuran, bukan teks polos merah.
  - CTA "Tambah ke Keranjang" full-width, sticky di mobile (supaya selalu terjangkau tanpa scroll ke atas), state disabled jelas sebelum ukuran dipilih.
  - Deskripsi produk: area teks dengan line-height lega, maksimal lebar baca (~65ch) supaya tidak melebar penuh di desktop.

### 5.4 Cart

- List item: thumbnail, nama produk + varian (warna/ukuran), harga satuan, qty stepper, subtotal per item, hapus item.
- Ringkasan: subtotal jelas, CTA "Lanjut ke Checkout" full-width dan menonjol.
- Empty cart state: didesain (ilustrasi/icon + CTA "Mulai Belanja" kembali ke katalog).
- Karena cart client-side (localStorage) dan di-revalidate saat checkout — desain state "harga/stok berubah sejak ditambahkan" (kalau backend menolak saat checkout) sebagai notice yang jelas, bukan error generik.

### 5.5 Checkout (guest)

Alur: data pembeli → alamat (provinsi → kota → kecamatan, cascading dropdown) → pilih kurir & layanan (hasil dari `/shipping/cost`) → ringkasan total → submit → redirect ke invoice Xendit.

- Desain sebagai **single-page dengan section jelas** (bukan wizard multi-step terpisah) supaya user bisa lihat semua sebelum submit — cocok dengan pola guest checkout yang cepat.
- Form fields: nama, No. WhatsApp (jelaskan ini kanal notifikasi utama, bukan sekadar formalitas), email (opsional), alamat lengkap.
- Dropdown wilayah cascading: state loading per level jelas (kota disabled sampai provinsi dipilih, dst).
- Pilihan kurir & layanan: tampilkan sebagai list card (nama kurir, layanan, estimasi, harga) dengan radio select, bukan dropdown native — lebih mudah dibandingkan.
- Ringkasan order sticky di sisi kanan (desktop) / di bawah form sebelum tombol submit (mobile): subtotal, ongkir, total.
- CTA akhir: "Lanjut ke Pembayaran" — set ekspektasi bahwa user akan diarahkan ke halaman Xendit (VA/QRIS/e-wallet/retail), supaya tidak bingung saat redirect.
- Validasi error per-field jelas (border merah + pesan singkat di bawah field, bukan alert global).

### 5.6 Order Tracking (publik)

- Input orderNumber (kalau diakses tanpa param) atau langsung tampil kalau via link `/track/{orderNumber}`.
- **Status timeline visual** (bukan hanya teks status): PENDING → PAID → PROCESSING → SHIPPED → COMPLETED, dengan step aktif ditandai jelas (warna ink/success), step yang belum tercapai muted. Untuk CANCELLED/EXPIRED, tampilkan sebagai state terpisah (bukan bagian dari timeline linear) dengan warna danger + penjelasan singkat.
- Tampilkan: no. pesanan, rincian item (snapshot nama/varian/qty/harga), alamat kirim, ongkir & total, no. resi (waybill) begitu status SHIPPED — dengan copy-to-clipboard kalau memungkinkan.
- Halaman ini publik & tanpa login — desain harus tetap terasa aman/terpercaya (bukan terkesan "bisa diakses siapa saja sembarangan") meski secara teknis memang cukup tahu nomor order.

### 5.7 States Global

- **Loading:** skeleton screens (bukan spinner generik) untuk grid produk & detail produk — konsisten dengan warna `surface-muted`.
- **Error state:** (API gagal/produk tidak ditemukan) — didesain ramah, ada CTA kembali ke katalog.
- **404:** halaman custom, bukan default Next.js.
- **Footer:** minimal — copyright, mungkin link social media (Instagram, karena brand ini streetwear yang biasanya besar di Instagram/TikTok).

---

## 6. Batasan dari Sisi Backend (jangan didesain di luar ini untuk Fase 1)

- **Tidak ada akun/login pembeli** — jangan desain halaman login/register/"akun saya" untuk fase 1. Order history hanya lewat link tracking per order.
- **Tidak ada review produk / rating / wishlist** — belum ada datanya di backend (rencana Fase 2).
- **Tidak ada kode promo/diskon** di Fase 1 — jangan desain input kode promo di checkout.
- Harga & ongkir **selalu dihitung ulang di server** — UI tidak perlu (dan tidak boleh terkesan) mengizinkan user mengubah harga di cart.
- Satu mata uang (IDR), satu bahasa (Indonesia) — tidak perlu selector currency/bahasa.

---

## 7. Enhancement Opsional (nice-to-have, di luar 6 halaman inti)

Boleh diusulkan oleh desain kalau relevan untuk kesan "e-commerce modern & bagus", tapi tidak mengubah scope data/API:

- Section "Instagram feed" atau social proof di homepage (statis dulu, tanpa integrasi API asli).
- Trust badges di dekat CTA checkout (pembayaran aman, estimasi kirim, dsb) — copy generik, bukan klaim yang perlu diverifikasi.
- Size guide sebagai modal/drawer di halaman produk (belum ada data ukuran presisi di backend — kalau didesain, tandai sebagai placeholder konten).
- Micro-interaction: toast konfirmasi "Ditambahkan ke keranjang" (saat ini ada state `added` sederhana di tombol — bisa dipercantik jadi toast).

---

## 8. Deliverables yang Diharapkan

1. **Design tokens**: warna, tipografi, spacing, radius, shadow — sebagai dasar implementasi Tailwind config.
2. **Screen desain** untuk 6 halaman di §4 (mobile + desktop breakpoint minimal).
3. **Komponen UI reusable**: product card, color swatch, size selector, qty stepper, status badge, timeline tracking, empty state, skeleton loading.
4. Catatan interaksi/motion untuk komponen yang tidak jelas dari gambar statis (hover, transisi galeri, toast, dsb).

---

## 9. Lampiran: Konteks Data (untuk akurasi desain)

Kategori produk: T-Shirt, Hoodie, Crewneck, Polo, Jacket, Cap.
Ukuran: S, M, L, XL, One Size (untuk item seperti cap).
Warna existing di katalog: Black, White, Blue, Grey, Navy.
Contoh SKU: `AIS-HDE1-BLU-L` (Hoodie desain 1, Blue, L).
Status order: `PENDING → PAID → PROCESSING → SHIPPED → COMPLETED`, atau `CANCELLED` / `EXPIRED`.
Format harga: `Rp` + separator ribuan ala Indonesia (mis. `Rp250.000`), tanpa desimal.

Skema data lengkap: lihat `apps/api/prisma/schema.prisma` dan [`PERANCANGAN.md`](./PERANCANGAN.md) §5 & §9 (API contract).
