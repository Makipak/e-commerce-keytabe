import Image from "next/image";
import Link from "next/link";
import { getProducts, formatIDR, imgSrc } from "@/lib/api";
import { CATEGORIES, type Category } from "@keytabee/shared";
import { Button } from "@/components/button";

export const revalidate = 60; // ISR: katalog refresh tiap 60 detik

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const { data: products } = await getProducts(params);

  return (
    <div>
      <section className="relative mb-10 flex aspect-[16/11] items-end overflow-hidden sm:mb-14 sm:aspect-[16/6]">
        <picture>
          <source media="(min-width: 640px)" srcSet="/banner/desktop.webp" />
          <img
            src="/banner/mobile.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative max-w-md p-6 sm:p-12">
          <h1 className="mb-2 text-[26px] font-bold leading-[1.15] tracking-tight text-white sm:mb-3.5 sm:text-5xl sm:leading-[1.05]">
            Koleksi Terbaru
          </h1>
          <p className="mb-4 text-sm leading-relaxed text-white/80 sm:mb-5 sm:text-[15px]">
            Desain baru untuk musim ini — dibuat lebih ringan, lebih rapi.
          </p>
          <Button href="#katalog" variant="primary">
            Lihat Koleksi
          </Button>
        </div>
      </section>

      <div id="katalog" className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:mb-6 sm:flex-wrap sm:gap-2.5">
        <Button href="/" variant="toggle" active={!params.category} size="sm" className="shrink-0 whitespace-nowrap">
          Semua
        </Button>
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <Button
            key={c}
            href={`/?category=${c}`}
            variant="toggle"
            active={params.category === c}
            size="sm"
            className="shrink-0 whitespace-nowrap"
          >
            {CATEGORIES[c]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="group">
            <div className="relative aspect-square overflow-hidden border border-keytabee-border bg-keytabee-surface-muted transition-transform duration-200 group-hover:scale-[1.01]">
              {p.thumbnailUrl && (
                <Image
                  src={imgSrc(p.thumbnailUrl)}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="mt-2.5 sm:mt-3.5">
              <div className="mb-1 text-[13px] leading-snug text-keytabee-ink sm:text-sm">{p.name}</div>
              <div className="text-sm font-medium text-keytabee-ink sm:text-[15px]">{formatIDR(p.basePrice)}</div>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center px-10 py-20 text-center sm:py-32">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="mb-4 text-keytabee-disabled sm:mb-5">
            <rect x="3" y="7" width="18" height="14" rx="1" stroke="currentColor" strokeWidth={1.6} />
            <path d="M3 7l3-4h12l3 4" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
            <path d="M9 11a3 3 0 006 0" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
          <p className="mb-1.5 text-[15px] font-semibold sm:text-lg">Belum ada produk</p>
          <p className="text-[13px] leading-relaxed text-keytabee-ink-muted sm:text-sm">
            Koleksi untuk kategori ini akan segera hadir. Cek kategori lain dulu, yuk.
          </p>
        </div>
      )}
    </div>
  );
}
