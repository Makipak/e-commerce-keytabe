import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ListResponse,
  ProductDetail,
  ProductListItem,
  ShippingCostOption,
} from "@keytabee/shared";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function get<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
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

export async function createOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API}${path}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json() as Promise<ShippingCostOption[]>);

export const formatIDR = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
