// ============ Enums / konstanta (sinkron dgn prisma/schema.prisma) ============

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SIZES = ["S", "M", "L", "XL", "OS"] as const;
export type Size = (typeof SIZES)[number];

export const CATEGORIES = {
  TSH: "T-Shirt",
  HDE: "Hoodie",
  SWT: "Crewneck",
  PLO: "Polo",
  JKT: "Jacket",
  CAP: "Cap",
  LNG: "Longsleeve",
  RGY: "Rugby Shirt",
  OTH: "Lainnya",
} as const;
export type Category = keyof typeof CATEGORIES;

export const COLORS = {
  BLK: "Black",
  WHT: "White",
  BLU: "Blue",
  GRY: "Dark Grey",
  NVY: "Navy",
  SKB: "Sky Blue",
} as const;
export type ColorCode = keyof typeof COLORS;

// ============ Util SKU ============
// Format: AIS-{KATEGORI}{NO_DESAIN}-{WARNA}-{SIZE}  → AIS-HDE1-BLU-L

export function buildSku(
  category: Category,
  designNo: number,
  color: ColorCode,
  size: Size,
): string {
  return `AIS-${category}${designNo}-${color}-${size}`;
}

export function parseSku(sku: string): {
  category: Category;
  designNo: number;
  color: ColorCode;
  size: Size;
} | null {
  const m = sku.match(/^AIS-([A-Z]{3})(\d+)-([A-Z]{3})-(S|M|L|XL|OS)$/);
  if (!m) return null;
  const [, cat, no, color, size] = m;
  if (!(cat in CATEGORIES) || !(color in COLORS)) return null;
  return {
    category: cat as Category,
    designNo: Number(no),
    color: color as ColorCode,
    size: size as Size,
  };
}

// ============ DTO / API contract ============

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  category: Category;
  categoryLabel: string | null;
  basePrice: number;
  thumbnailUrl: string | null;
  colorCodes: ColorCode[];
}

export interface ProductImageDto {
  id: string;
  colorCode: ColorCode;
  url: string;
  view: "front" | "back";
  type: "model" | "flat";
  sortOrder: number;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  colorCode: ColorCode;
  colorName: string;
  size: Size;
  price: number; // sudah resolved (price ?? basePrice)
  stock: number;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: Category;
  categoryLabel: string | null;
  basePrice: number;
  weightGram: number;
  variants: ProductVariantDto[];
  images: ProductImageDto[];
}

export interface CartItem {
  variantId: string;
  qty: number;
}

export interface CreateOrderRequest {
  items: CartItem[];
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  address: string;
  provinceId: number;
  cityId: number;
  districtId: number;
  postalCode?: string;
  courier: string; // "jne" | "sicepat" | ...
  courierService: string; // "REG" | ...
}

export interface CreateOrderResponse {
  orderNumber: string;
  invoiceUrl: string;
  total: number;
}

export interface OrderTrackResponse {
  orderNumber: string;
  status: OrderStatus;
  guestName: string;
  items: { sku: string; name: string; price: number; qty: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  courier: string;
  courierService: string;
  waybill: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface ShippingCostRequest {
  districtId: number;
  weightGram: number;
  courier: string;
}

export interface ShippingCostOption {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
}
