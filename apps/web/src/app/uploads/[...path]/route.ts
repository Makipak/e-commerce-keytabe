import { NextRequest } from "next/server";

// Proxy gambar produk: ambil dari API via localhost (satu mesin saat demo ngrok)
// supaya browser cuma perlu hit domain frontend sendiri (sudah lolos interstitial
// ngrok) dan gambar tidak perlu bolak-balik lewat tunnel ngrok API.
const INTERNAL_API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const upstream = await fetch(`${INTERNAL_API}/uploads/${path.join("/")}`, {
    headers: { "ngrok-skip-browser-warning": "true" },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
