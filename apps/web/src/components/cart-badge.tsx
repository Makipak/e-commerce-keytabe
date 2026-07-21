"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartBadge() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative flex shrink-0 items-center" aria-label="Keranjang">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 8h12l-1.2 11.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z"
          stroke="#171717"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path d="M9 8V6a3 3 0 016 0v2" stroke="#171717" strokeWidth={1.8} />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-[7px] flex h-4 min-w-4 items-center justify-center rounded-full bg-keytabee-accent px-[3px] text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
