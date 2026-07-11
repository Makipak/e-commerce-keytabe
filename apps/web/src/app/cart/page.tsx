"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatIDR } from "@/lib/api";

export default function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500">Keranjang masih kosong.</p>
        <Link href="/" className="mt-4 inline-block underline">Lihat katalog</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold">Keranjang</h1>
      <div className="divide-y">
        {lines.map((l) => (
          <div key={l.variantId} className="flex items-center gap-4 py-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
              {l.imageUrl && <Image src={l.imageUrl} alt={l.productName} fill className="object-cover" sizes="64px" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{l.productName}</div>
              <div className="text-xs text-neutral-500">
                {l.colorName} / {l.size} · {l.sku}
              </div>
              <div className="text-sm">{formatIDR(l.price)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(l.variantId, l.qty - 1)} className="h-7 w-7 rounded border">−</button>
              <span className="w-6 text-center text-sm">{l.qty}</span>
              <button onClick={() => setQty(l.variantId, l.qty + 1)} className="h-7 w-7 rounded border">+</button>
            </div>
            <button onClick={() => remove(l.variantId)} className="text-xs text-red-600">Hapus</button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <span className="font-medium">Subtotal</span>
        <span className="text-lg font-bold">{formatIDR(subtotal)}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">Ongkir dihitung saat checkout.</p>
      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-lg bg-neutral-900 py-3 text-center text-white"
      >
        Lanjut ke Checkout
      </Link>
    </div>
  );
}
