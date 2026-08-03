"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ColorCode, ProductDetail } from "@keytabee/shared";
import { formatIDR, imgSrc } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/button";

const COLOR_HEX: Record<ColorCode, string> = {
  BLK: "#171717",
  WHT: "#FFFFFF",
  BLU: "#3B5A78",
  GRY: "#8C8880",
  NVY: "#25324A",
  SKB: "#7EB6E0",
};

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
  const lowStockNotice = selected && selected.stock > 0 && selected.stock <= 3 ? `Sisa ${selected.stock} pcs!` : null;

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
      imageUrl: imgSrc(images[activeImage]?.url) || null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="pb-24 md:pb-0">
      <div className="grid gap-8 md:grid-cols-2 md:gap-16">
        <div>
          <div className="relative aspect-square overflow-hidden border border-keytabee-border bg-keytabee-surface-muted">
            {images.length > 0 ? (
              <Image
                key={images[activeImage].id}
                src={imgSrc(images[activeImage].url)}
                alt={`${product.name} ${images[activeImage].view} ${images[activeImage].type}`}
                fill
                className="object-cover"
                sizes="50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-keytabee-ink-muted">
                Foto belum tersedia
              </div>
            )}

            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  onClick={() => showImage(activeImage - 1)}
                  aria-label="Foto sebelumnya"
                  variant="icon"
                  className="!absolute left-3 top-1/2 -translate-y-1/2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
                <Button
                  type="button"
                  onClick={() => showImage(activeImage + 1)}
                  aria-label="Foto berikutnya"
                  variant="icon"
                  className="!absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => showImage(i)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden border bg-keytabee-surface-muted sm:h-[88px] sm:w-[88px] ${
                    i === activeImage ? "border-keytabee-ink" : "border-keytabee-border opacity-70"
                  }`}
                >
                  <Image src={imgSrc(img.url)} alt={`${product.name} ${img.view} ${img.type}`} fill className="object-cover" sizes="88px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="mb-1.5 text-[22px] font-bold leading-tight tracking-tight sm:mb-2.5 sm:text-[34px]">
            {product.name}
          </h1>
          <p className="mb-6 text-lg font-medium sm:mb-9 sm:text-2xl">{formatIDR(price)}</p>

          {colors.length > 1 && (
            <div className="mb-6 sm:mb-8">
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted sm:mb-3">
                Warna — {colors.find(([code]) => code === colorCode)?.[1]}
              </div>
              <div className="flex gap-2.5 sm:gap-3">
                {colors.map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    aria-label={name}
                    onClick={() => changeColor(code)}
                    className="h-[30px] w-[30px] rounded-full sm:h-[34px] sm:w-[34px]"
                    style={{
                      background: COLOR_HEX[code],
                      border: `2px solid ${colorCode === code ? "#0572FF" : "#DCE3EA"}`,
                      boxShadow: colorCode === code ? "0 0 0 2px #fff inset" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 sm:mb-9">
            <div className="mb-2.5 flex items-center justify-between sm:mb-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted">Ukuran</div>
              {lowStockNotice && (
                <div className="rounded bg-keytabee-warning/10 px-2 py-0.5 text-[11px] font-semibold text-keytabee-warning sm:px-2.5 sm:text-xs">
                  {lowStockNotice}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 sm:inline-grid sm:grid-cols-4 sm:gap-2.5">
              {sizesForColor.map((v) => (
                <Button
                  key={v.id}
                  type="button"
                  disabled={v.stock === 0}
                  onClick={() => setSize(v.size)}
                  variant="toggle"
                  active={size === v.size}
                  className={`h-11 sm:h-12 sm:w-[72px] ${v.stock === 0 ? "line-through" : ""}`}
                >
                  {v.size === "OS" ? "One Size" : v.size}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!selected}
            variant="primary"
            size="lg"
            fullWidth
            className="hidden sm:mb-9 md:flex"
          >
            {added ? "✓ Masuk keranjang" : selected ? "Tambah ke Keranjang" : "Pilih ukuran dulu"}
          </Button>

          {product.description && (
            <p className="max-w-[65ch] text-sm leading-relaxed text-keytabee-ink-muted sm:text-sm sm:leading-[1.7]">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-keytabee-border bg-keytabee-bg/90 px-5 pb-7 pt-4 backdrop-blur md:hidden">
        <Button onClick={handleAdd} disabled={!selected} variant="primary" size="lg" fullWidth>
          {added ? "✓ Masuk keranjang" : selected ? "Tambah ke Keranjang" : "Pilih ukuran dulu"}
        </Button>
      </div>
    </div>
  );
}
