import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ListResponse,
  ProductDetail,
  ProductListItem,
  ShippingCostOption,
} from "@keytabee/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// get() hanya dipanggil dari Server Component (SSR/ISR), jalan di mesin yang sama
// dengan API saat demo ngrok — pakai localhost langsung, jangan lewat tunnel
// (menghindari 1 round-trip ke cloud ngrok + jatah bandwidth free plan).
const INTERNAL_API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

// Lewati halaman peringatan interstitial ngrok free plan saat demo online
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

async function get<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${INTERNAL_API}${path}`, { next: { revalidate }, headers: NGROK_HEADERS });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

/**
 * Ubah URL gambar absolut dari API (mis. https://xxxx.ngrok-free.app/uploads/foo.jpg)
 * jadi path relatif yang di-proxy lewat server Next sendiri di /uploads/foo.jpg.
 * Kenapa: <img>/next-image tidak bisa kirim header custom, jadi request lintas-domain
 * ke tunnel ngrok API selalu kena halaman interstitial (bukan gambar). Dengan proxy
 * relatif, browser cuma bicara ke domain yang sama dgn halaman (sudah lolos interstitial),
 * lalu server Next yang ambil gambar asli via localhost.
 */
export function imgSrc(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).pathname; // -> /uploads/foo.jpg
  } catch {
    return url;
  }
}

export const getProducts = (params?: { category?: string; search?: string; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  return get<ListResponse<ProductListItem>>(`/products?${q}`);
};

export const getProduct = (slug: string) =>
  get<ProductDetail>(`/products/${slug}`, 60);

export const trackOrder = (orderNumber: string) =>
  get<any>(`/orders/track/${orderNumber}`, 0);

// ===== Client-side (dipanggil dari client component) =====

export async function confirmOrderReceived(orderNumber: string): Promise<{ orderNumber: string; status: string }> {
  const res = await fetch(`${API}/orders/track/${orderNumber}/complete`, {
    method: "POST",
    headers: NGROK_HEADERS,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Gagal konfirmasi pesanan diterima");
  }
  return res.json();
}

export async function createOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? "Checkout gagal");
  }
  return res.json();
}

/** Fetch yang memvalidasi hasilnya array — respons error jadi exception, bukan crash .map() */
async function getArray<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API}${path}`, { headers: NGROK_HEADERS });
  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(data?.message ?? `Gagal memuat ${path}`);
  }
  return data;
}

export const getProvinces = () => getArray<{ id: number; name: string }>("/shipping/provinces");
export const getCities = (provinceId: number) =>
  getArray<{ id: number; name: string }>(`/shipping/cities/${provinceId}`);
export const getDistricts = (cityId: number) =>
  getArray<{ id: number; name: string }>(`/shipping/districts/${cityId}`);
export const getShippingCost = (body: { districtId: number; weightGram: number; courier: string }) =>
  fetch(`${API}/shipping/cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
    body: JSON.stringify(body),
  }).then((r) => r.json() as Promise<ShippingCostOption[]>);

export const formatIDR = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
