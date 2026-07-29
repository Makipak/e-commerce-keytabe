import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/track-order-form";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
};

export default function TrackIndexPage() {
  return (
    <div className="mx-auto max-w-lg py-10 sm:py-16">
      <h1 className="mb-2 text-xl font-bold tracking-tight sm:text-2xl">Lacak Pesanan</h1>
      <p className="mb-7 text-sm leading-relaxed text-keytabee-ink-muted sm:mb-9">
        Masukkan nomor pesananmu untuk melihat status terkini. Nomor pesanan bisa dilihat di
        pesan WhatsApp konfirmasi yang kami kirim.
      </p>
      <TrackOrderForm />
    </div>
  );
}
