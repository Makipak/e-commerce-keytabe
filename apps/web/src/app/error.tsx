"use client";

import { Button } from "@/components/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center px-10 py-20 text-center sm:py-32">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="mb-4 text-keytabee-danger sm:mb-5 sm:h-14 sm:w-14">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth={1.6} />
        <path d="M12 7v6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
      <p className="mb-1.5 text-[15px] font-semibold sm:text-lg">Terjadi kesalahan</p>
      <p className="mb-5 max-w-sm text-[13px] leading-relaxed text-keytabee-ink-muted sm:mb-6 sm:text-sm">
        Produk tidak ditemukan, atau server sedang bermasalah. Coba lagi sebentar lagi.
      </p>
      <Button onClick={reset} variant="primary">
        Coba Lagi
      </Button>
    </div>
  );
}
