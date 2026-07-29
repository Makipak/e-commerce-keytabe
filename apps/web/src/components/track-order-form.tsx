"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TrackOrderForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        autoComplete="off"
        placeholder="Contoh: KTB-20260708-0001"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        className="h-[50px] flex-1 border border-keytabee-border bg-keytabee-surface-muted px-4 text-[15px] placeholder:text-keytabee-ink-muted focus:outline-none"
      />
      <button
        type="submit"
        className="h-[50px] shrink-0 bg-keytabee-ink px-7 text-sm font-semibold text-white"
      >
        Lacak Pesanan
      </button>
    </form>
  );
}
