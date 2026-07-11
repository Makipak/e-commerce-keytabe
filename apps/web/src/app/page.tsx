import Image from "next/image";
import Link from "next/link";
import { getProducts, formatIDR } from "@/lib/api";
import { CATEGORIES, type Category } from "@keytabee/shared";

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
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link
          href="/"
          className={`rounded-full border px-3 py-1 ${!params.category ? "bg-neutral-900 text-white" : ""}`}
        >
          Semua
        </Link>
        {(Object.keys(CATEGORIES) as Category[]).map((c) => (
          <Link
            key={c}
            href={`/?category=${c}`}
            className={`rounded-full border px-3 py-1 ${params.category === c ? "bg-neutral-900 text-white" : ""}`}
          >
            {CATEGORIES[c]}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="group">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
              {p.thumbnailUrl && (
                <Image
                  src={p.thumbnailUrl}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition group-hover:scale-105"
                />
              )}
            </div>
            <div className="mt-2 text-sm font-medium">{p.name}</div>
            <div className="text-sm text-neutral-600">{formatIDR(p.basePrice)}</div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <p className="py-16 text-center text-neutral-500">Belum ada produk.</p>
      )}
    </div>
  );
}
