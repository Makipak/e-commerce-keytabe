import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { CartBadge } from "@/components/cart-badge";

export const metadata: Metadata = {
  title: { default: "Keytabee — aissential", template: "%s | Keytabee" },
  description: "Official merchandise aissential — apparel & accessories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <CartProvider>
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-bold tracking-tight">
                keytabee
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link href="/">Katalog</Link>
                <CartBadge />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t py-8 text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} Keytabee × aissential
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
