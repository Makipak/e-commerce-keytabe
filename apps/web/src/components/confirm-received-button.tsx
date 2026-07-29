"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmOrderReceived } from "@/lib/api";

export function ConfirmReceivedButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await confirmOrderReceived(orderNumber);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="mb-6 border border-keytabee-border bg-keytabee-surface-muted p-4 sm:mb-9 sm:p-5">
        <p className="mb-3 text-[13px] leading-relaxed sm:text-sm">
          Yakin barang sudah kamu terima? Aksi ini tidak bisa dibatalkan.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={submit}
            disabled={loading}
            className="h-[42px] flex-1 bg-keytabee-ink text-[13px] font-semibold text-white disabled:opacity-50 sm:text-sm"
          >
            {loading ? "Memproses..." : "Ya, Sudah Diterima"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="h-[42px] flex-1 border border-keytabee-border text-[13px] font-semibold sm:text-sm"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-9">
      <button
        onClick={() => setConfirming(true)}
        className="h-[50px] w-full bg-keytabee-ink text-[15px] font-semibold text-white"
      >
        Pesanan Diterima
      </button>
      {error && <p className="mt-2 text-xs text-keytabee-danger">{error}</p>}
    </div>
  );
}
