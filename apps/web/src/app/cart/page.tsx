"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatIDR } from "@/lib/api";

export default function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center px-10 py-24 text-center sm:py-32">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="mb-4 text-keytabee-disabled sm:mb-5 sm:h-[60px] sm:w-[60px]">
          <path d="M6 8h12l-1.2 11.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth={1.6} />
        </svg>
        <p className="mb-1.5 text-[15px] font-semibold sm:text-lg">Keranjang kamu masih kosong</p>
        <p className="mb-5 text-[13px] text-keytabee-ink-muted sm:mb-6 sm:text-sm">Yuk lihat koleksi terbaru dulu.</p>
        <Link href="/" className="bg-keytabee-ink px-6 py-3 text-sm font-medium text-white sm:px-7 sm:py-3.5">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-0">
      <div className="grid gap-10 md:grid-cols-[1fr_380px] md:items-start md:gap-16">
        <div>
          <h1 className="mb-5 text-xl font-bold tracking-tight sm:mb-6 sm:text-[26px]">Keranjang</h1>
          <div className="divide-y divide-keytabee-border">
            {lines.map((l) => (
              <div key={l.variantId} className="flex items-center gap-4 py-4 sm:gap-5 sm:py-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-keytabee-border bg-keytabee-surface-muted sm:h-[88px] sm:w-[88px]">
                  {l.imageUrl && <Image src={l.imageUrl} alt={l.productName} fill className="object-cover" sizes="88px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 text-[13px] font-medium sm:text-[15px]">{l.productName}</div>
                  <div className="text-xs text-keytabee-ink-muted sm:text-[13px]">
                    {l.colorName} / {l.size}
                  </div>
                  <div className="mt-2 flex items-center justify-between sm:hidden">
                    <div className="flex items-center gap-2.5 border border-keytabee-border">
                      <button onClick={() => setQty(l.variantId, l.qty - 1)} className="h-[26px] w-[26px] text-base">−</button>
                      <span className="min-w-3.5 text-center text-[13px]">{l.qty}</span>
                      <button onClick={() => setQty(l.variantId, l.qty + 1)} className="h-[26px] w-[26px] text-base">+</button>
                    </div>
                    <div className="text-[13px] font-medium">{formatIDR(l.price * l.qty)}</div>
                  </div>
                </div>
                <div className="hidden items-center gap-3 border border-keytabee-border sm:flex">
                  <button onClick={() => setQty(l.variantId, l.qty - 1)} className="h-[30px] w-[30px] text-base">−</button>
                  <span className="min-w-4 text-center text-sm">{l.qty}</span>
                  <button onClick={() => setQty(l.variantId, l.qty + 1)} className="h-[30px] w-[30px] text-base">+</button>
                </div>
                <div className="hidden w-[110px] text-right text-[15px] font-medium sm:block">
                  {formatIDR(l.price * l.qty)}
                </div>
                <button onClick={() => remove(l.variantId)} aria-label="Hapus" className="shrink-0 text-keytabee-ink-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-keytabee-border bg-keytabee-surface p-5 sm:sticky sm:top-[100px] sm:p-7">
          <div className="mb-4 text-base font-semibold sm:mb-5">Ringkasan</div>
          <div className="mb-3 flex justify-between text-sm text-keytabee-ink-muted sm:mb-4">
            <span>Subtotal</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <div className="mb-5 flex justify-between border-t border-keytabee-border pt-4 text-base font-semibold sm:mb-6 sm:text-[17px]">
            <span>Total</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="hidden h-[52px] w-full items-center justify-center bg-keytabee-ink text-[15px] font-semibold text-white sm:flex"
          >
            Lanjut ke Checkout
          </Link>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-keytabee-border bg-keytabee-bg/90 px-5 pb-7 pt-4 backdrop-blur md:hidden">
        <Link href="/checkout" className="flex h-[50px] w-full items-center justify-center bg-keytabee-ink text-[15px] font-semibold text-white">
          Lanjut ke Checkout
        </Link>
      </div>
    </div>
  );
}
