import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wajib: @keytabee/shared adalah TS source dari workspace, perlu di-transpile Next
  transpilePackages: ["@keytabee/shared"],
  images: {
    remotePatterns: [
      // Gambar dari API lokal (dev). Di production ganti dgn domain API.
      { protocol: "http", hostname: "localhost", port: "4000" },
    ],
  },
};

export default nextConfig;
