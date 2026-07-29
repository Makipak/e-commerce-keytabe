import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wajib: @keytabee/shared adalah TS source dari workspace, perlu di-transpile Next
  transpilePackages: ["@keytabee/shared"],
  // Izinkan akses dev server lewat tunnel ngrok saat demo online
  allowedDevOrigins: ["*.ngrok-free.app"],
  images: {
    remotePatterns: [
      // Gambar dari API lokal (dev). Di production ganti dgn domain API.
      { protocol: "http", hostname: "localhost", port: "4000" },
      // Gambar dari API via tunnel ngrok (demo online)
      { protocol: "https", hostname: "*.ngrok-free.app" },
    ],
  },
};

export default nextConfig;
