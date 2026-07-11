/**
 * Data provider custom untuk REST API NestJS kita.
 * Kontrak: GET /admin/{resource}?page=&pageSize= → { data: T[], total }
 */
import type { DataProvider } from "@refinedev/core";
import { getToken } from "./auth-provider";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const error: any = new Error(body?.message ?? res.statusText);
    error.statusCode = res.status;
    throw error;
  }
  return res.json();
}

export const dataProvider: DataProvider = {
  getApiUrl: () => API,

  getList: async ({ resource, pagination, filters }) => {
    const params = new URLSearchParams();
    params.set("page", String((pagination as any)?.current ?? (pagination as any)?.currentPage ?? 1));
    params.set("pageSize", String(pagination?.pageSize ?? 20));
    // Filter sederhana: field=value (mis. status order)
    filters?.forEach((f) => {
      if ("field" in f && f.value != null && f.value !== "") {
        params.set(f.field, String(f.value));
      }
    });
    const res = await request(`/admin/${resource}?${params}`);
    return { data: res.data, total: res.total };
  },

  getOne: async ({ resource, id }) => {
    const data = await request(`/admin/${resource}/${id}`);
    return { data };
  },

  create: async ({ resource, variables }) => {
    const data = await request(`/admin/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const data = await request(`/admin/${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(variables),
    });
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const data = await request(`/admin/${resource}/${id}`, { method: "DELETE" });
    return { data };
  },
};

/** Helper untuk endpoint non-CRUD (mis. update status order) */
export const apiRequest = request;

/** Upload file gambar → { url, filename }. Jangan set Content-Type manual (FormData). */
export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API}/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Upload gagal");
  }
  return res.json();
}
