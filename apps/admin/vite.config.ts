import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy gambar produk lewat dev server sendiri (localhost -> API) supaya
        // browser cuma bicara ke domain admin, tidak perlu tahu host API.
        "/uploads": {
          target: env.VITE_API_INTERNAL_URL || "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
  };
});
