"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartBadge() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative">
      Cart
      {count > 0 && (
        <span className="ml-1 rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
