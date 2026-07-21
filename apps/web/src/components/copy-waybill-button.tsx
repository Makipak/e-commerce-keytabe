"use client";

import { useState } from "react";

export function CopyWaybillButton({ waybill }: { waybill: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(waybill);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button onClick={copy} className="text-[13px] font-medium text-keytabee-accent sm:text-sm">
      {copied ? "Disalin!" : "Salin"}
    </button>
  );
}
