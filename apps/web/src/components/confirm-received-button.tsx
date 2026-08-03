"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmOrderReceived } from "@/lib/api";
import { Button } from "@/components/button";

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
          <Button onClick={submit} disabled={loading} variant="primary" size="sm" className="h-[42px] flex-1">
            {loading ? "Memproses..." : "Ya, Sudah Diterima"}
          </Button>
          <Button
            onClick={() => setConfirming(false)}
            disabled={loading}
            variant="secondary"
            size="sm"
            className="h-[42px] flex-1"
          >
            Batal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-9">
      <Button onClick={() => setConfirming(true)} variant="primary" size="lg" fullWidth>
        Pesanan Diterima
      </Button>
      {error && <p className="mt-2 text-xs text-keytabee-danger">{error}</p>}
    </div>
  );
}
