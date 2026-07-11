"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductDetail } from "@keytabee/shared";
import { formatIDR } from "@/lib/api";
import { useCart } from "@/lib/cart";

export function ProductView({ product }: { product: ProductDetail }) {
  const { add } = useCart();
  const colors = useMemo(
    () => [...new Map(product.variants.map((v) => [v.colorCode, v.colorName])).entries()],
    [product.variants],
  );
  const [colorCode, setColorCode] = useState(colors[0]?.[0]);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const sizesForColor = product.variants.filter((v) => v.colorCode === colorCode);
  const selected = sizesForColor.find((v) => v.size === size) ?? null;
  const images = product.images.filter((i) => i.colorCode === colorCode);
  const price = selected?.price ?? product.basePrice;

  const handleAdd = () => {
    if (!selected) return;
    add({
      variantId: selected.id,
      sku: selected.sku,
      productName: product.name,
      colorName: selected.colorName,
      size: selected.size,
      price: selected.price,
      weightGram: product.weightGram,
      imageUrl: images[0]?.url ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
            <Image src={img.url} alt={`${product.name} ${img.view} ${img.type}`} fill className="object-cover" sizes="50vw" />
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-2 flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
            Foto belum tersedia
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-2 text-xl">{formatIDR(price)}</p>
        {product.description && (
          <p className="mt-4 text-sm text-neutral-600">{product.description}</p>
        )}

        {colors.length > 1 && (
          <div className="mt-6">
            <div className="mb-2 text-sm font-medium">Warna</div>
            <div className="flex gap-2">
              {colors.map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => { setColorCode(code); setSize(null); }}
                  className={`rounded border px-3 py-1 text-sm ${colorCode === code ? "border-neutral-900 bg-neutral-900 text-white" : ""}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 text-sm font-medium">Ukuran</div>
          <div className="flex gap-2">
            {sizesForColor.map((v) => (
              <button
                key={v.id}
                disabled={v.stock === 0}
                onClick={() => setSize(v.size)}
                className={`min-w-12 rounded border px-3 py-2 text-sm ${
                  size === v.size ? "border-neutral-900 bg-neutral-900 text-white" : ""
                } ${v.stock === 0 ? "cursor-not-allowed opacity-40 line-through" : ""}`}
              >
                {v.size === "OS" ? "One Size" : v.size}
              </button>
            ))}
          </div>
          {selected && selected.stock <= 3 && (
            <p className="mt-2 text-xs text-red-600">Sisa {selected.stock} pcs!</p>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!selected}
          className="mt-8 w-full rounded-lg bg-neutral-900 py-3 text-white disabled:opacity-40"
        >
          {added ? "✓ Masuk keranjang" : selected ? "Tambah ke Keranjang" : "Pilih ukuran dulu"}
        </button>
      </div>
    </div>
  );
}
