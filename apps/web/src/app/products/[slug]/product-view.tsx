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
  const [activeImage, setActiveImage] = useState(0);

  const sizesForColor = product.variants.filter((v) => v.colorCode === colorCode);
  const selected = sizesForColor.find((v) => v.size === size) ?? null;
  const images = product.images.filter((i) => i.colorCode === colorCode);
  const price = selected?.price ?? product.basePrice;

  const changeColor = (code: typeof colorCode) => {
    setColorCode(code);
    setSize(null);
    setActiveImage(0);
  };

  const showImage = (index: number) => {
    setActiveImage((index + images.length) % images.length);
  };

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
      imageUrl: images[activeImage]?.url ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
          {images.length > 0 ? (
            <Image
              key={images[activeImage].id}
              src={images[activeImage].url}
              alt={`${product.name} ${images[activeImage].view} ${images[activeImage].type}`}
              fill
              className="object-cover"
              sizes="50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">Foto belum tersedia</div>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => showImage(activeImage - 1)}
                aria-label="Foto sebelumnya"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow hover:bg-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => showImage(activeImage + 1)}
                aria-label="Foto berikutnya"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-900 shadow hover:bg-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {activeImage + 1}/{images.length}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => showImage(i)}
                className={`relative aspect-square overflow-hidden rounded-lg bg-neutral-100 ${
                  i === activeImage ? "ring-2 ring-neutral-900" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt={`${product.name} ${img.view} ${img.type}`} fill className="object-cover" sizes="25vw" />
              </button>
            ))}
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
                  onClick={() => changeColor(code)}
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
