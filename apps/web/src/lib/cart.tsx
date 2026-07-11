"use client";

/**
 * Cart client-side (localStorage). Keputusan desain: cart tidak disimpan
 * di server — server re-validasi harga & stok saat checkout (POST /orders).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  variantId: string;
  sku: string;
  productName: string;
  colorName: string;
  size: string;
  price: number;
  weightGram: number;
  imageUrl: string | null;
  qty: number;
}

interface CartCtx {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  subtotal: number;
  totalWeight: number;
  count: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "keytabee_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { ...line, qty }];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback(
    (variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
    [],
  );

  const clear = useCallback(() => setLines([]), []);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totalWeight = lines.reduce((s, l) => s + l.weightGram * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <Ctx value={{ lines, add, setQty, remove, clear, subtotal, totalWeight, count }}>
      {children}
    </Ctx>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart harus di dalam <CartProvider>");
  return ctx;
}
