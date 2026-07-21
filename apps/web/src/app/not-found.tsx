import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-10 py-20 text-center sm:py-32">
      <div className="mb-2.5 text-6xl font-bold tracking-tight sm:mb-3 sm:text-[88px]">404</div>
      <p className="mb-1.5 text-[15px] font-semibold sm:text-lg">Halaman tidak ditemukan</p>
      <p className="mb-5 text-[13px] leading-relaxed text-keytabee-ink-muted sm:mb-6 sm:text-sm">
        Tautan yang kamu buka mungkin sudah tidak berlaku.
      </p>
      <Link href="/" className="bg-keytabee-ink px-6 py-3 text-sm font-medium text-white sm:px-7 sm:py-3.5">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
