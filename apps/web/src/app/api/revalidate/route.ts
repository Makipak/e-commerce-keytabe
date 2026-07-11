import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation — dipanggil NestJS saat admin mengubah produk.
 * Cache ISR halaman terkait langsung dibuang, jadi perubahan terlihat
 * begitu halaman di-load berikutnya (tanpa menunggu window 60 detik).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
  for (const path of paths) {
    revalidatePath(path);
  }
  return NextResponse.json({ revalidated: true, paths });
}
