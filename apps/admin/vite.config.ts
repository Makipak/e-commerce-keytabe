import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      // Izinkan akses lewat tunnel ngrok saat demo online
      allowedHosts: [".ngrok-free.app"],
      proxy: {
        // Proxy gambar produk lewat dev server sendiri (localhost -> API),
        // bukan langsung ke domain ngrok API. <Image> tidak bisa kirim header
        // custom, jadi request lintas-domain ke tunnel API selalu kena halaman
        // interstitial ngrok (bukan gambar). Lewat proxy ini, browser cuma
        // bicara ke domain admin (sudah lolos interstitial), lalu Vite yang
        // ambil gambar asli via localhost + header skip-warning.
        "/uploads": {
          // localhost, bukan env.VITE_API_URL (itu domain ngrok publik) — dev
          // server & API jalan di mesin yang sama saat demo, jadi tidak perlu
          // ikut keluar-masuk tunnel ngrok untuk ambil byte gambar.
          target: env.VITE_API_INTERNAL_URL || "http://localhost:4000",
          changeOrigin: true,
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      },
    },
  };
});
