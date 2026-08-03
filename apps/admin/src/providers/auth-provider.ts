import type { AuthProvider } from "@refinedev/core";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "keytabee_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return {
        success: false,
        error: { name: "LoginError", message: "Email atau password salah" },
      };
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem("keytabee_admin_user", JSON.stringify(data.user));
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    return { success: true, redirectTo: "/login" };
  },
  check: async () =>
    getToken() ? { authenticated: true } : { authenticated: false, redirectTo: "/login" },
  onError: async (error) => {
    if (error?.statusCode === 401) {
      localStorage.removeItem(TOKEN_KEY);
      return { logout: true, redirectTo: "/login" };
    }
    return {};
  },
  getIdentity: async () => {
    const raw = localStorage.getItem("keytabee_admin_user");
    return raw ? JSON.parse(raw) : null;
  },
};
