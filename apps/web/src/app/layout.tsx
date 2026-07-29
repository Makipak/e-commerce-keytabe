import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { CartBadge } from "@/components/cart-badge";
import { SearchForm } from "@/components/search-form";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Aissential — aissential", template: "%s | Aissential" },
  description: "Official merchandise aissential — apparel & accessories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-keytabee-bg font-sans text-keytabee-ink antialiased">
        <CartProvider>
          <header className="sticky top-0 z-20 border-b border-keytabee-border bg-keytabee-bg/85 backdrop-blur">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-4 sm:px-10">
              <Link href="/" className="shrink-0 text-lg font-bold tracking-tight sm:text-[19px]">
                Aissential
              </Link>
              <nav className="flex flex-1 items-center justify-end gap-4 sm:gap-9">
                <Link href="/" className="hidden text-sm font-medium sm:block">
                  Katalog
                </Link>
                <Link href="/track" className="hidden text-sm font-medium sm:block">
                  Lacak Pesanan
                </Link>
                <SearchForm />
                <CartBadge />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-10 sm:py-12">{children}</main>
          <footer className="border-t border-keytabee-border">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-8 text-xs text-keytabee-ink-muted sm:px-10 sm:text-[13px]">
              <span>© {new Date().getFullYear()} Aissential</span>
              <span className="text-keytabee-accent">Instagram</span>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
