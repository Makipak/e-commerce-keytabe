import { getProduct } from "@/lib/api";
import { ProductView } from "./product-view";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product.name,
    description: product.description ?? `${product.name} — official aissential merch.`,
    openGraph: {
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return <ProductView product={product} />;
}
