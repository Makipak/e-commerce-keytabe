import { notFound } from "next/navigation";
import { getProduct, imgSrc } from "@/lib/api";
import { ProductView } from "./product-view";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — official aissential merch.`,
    openGraph: {
      images: product.images[0]?.url ? [imgSrc(product.images[0].url)] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) notFound();
  return <ProductView product={product} />;
}
