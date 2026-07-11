/**
 * Seed: admin user + contoh produk dari katalog asset Drive.
 * Jalankan: pnpm db:seed (dari root) — pastikan DATABASE_URL terisi.
 */
import { PrismaClient, Category, Size } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SIZES: Size[] = [Size.S, Size.M, Size.L, Size.XL];

interface SeedProduct {
  slug: string;
  name: string;
  category: Category;
  designNo: number;
  basePrice: number;
  weightGram: number;
  colors: { code: string; name: string }[];
  oneSize?: boolean;
}

// TODO: harga & berat final konfirmasi owner — ini placeholder wajar
const products: SeedProduct[] = [
  { slug: "cap-aissential", name: "Aissential Cap", category: Category.CAP, designNo: 1, basePrice: 149000, weightGram: 150, colors: [{ code: "BLK", name: "Black" }], oneSize: true },
  { slug: "hoodie-box-logo", name: "Hoodie Box Logo", category: Category.HDE, designNo: 1, basePrice: 349000, weightGram: 650, colors: [{ code: "BLU", name: "Blue" }] },
  { slug: "hoodie-tags", name: "Hoodie Tags", category: Category.HDE, designNo: 2, basePrice: 349000, weightGram: 650, colors: [{ code: "BLK", name: "Black" }, { code: "BLU", name: "Blue" }] },
  { slug: "hoodie-basic", name: "Hoodie Basic", category: Category.HDE, designNo: 3, basePrice: 329000, weightGram: 650, colors: [{ code: "GRY", name: "Dark Grey" }] },
  { slug: "jacket-human-brilliance", name: "Jacket Human Brilliance", category: Category.JKT, designNo: 1, basePrice: 449000, weightGram: 700, colors: [{ code: "WHT", name: "White" }] },
  { slug: "polo-aissential", name: "Aissential Polo", category: Category.PLO, designNo: 1, basePrice: 199000, weightGram: 300, colors: [{ code: "NVY", name: "Navy" }] },
  { slug: "crewneck-404", name: "Crewneck 404", category: Category.SWT, designNo: 1, basePrice: 279000, weightGram: 550, colors: [{ code: "BLK", name: "Black" }] },
  { slug: "crewneck-human-brilliance", name: "Crewneck Human Brilliance", category: Category.SWT, designNo: 2, basePrice: 279000, weightGram: 550, colors: [{ code: "BLU", name: "Blue" }] },
  { slug: "tshirt-design-1", name: "T-Shirt Design 1", category: Category.TSH, designNo: 1, basePrice: 159000, weightGram: 250, colors: [{ code: "BLK", name: "Black" }, { code: "WHT", name: "White" }] },
  { slug: "tshirt-design-2", name: "T-Shirt Design 2", category: Category.TSH, designNo: 2, basePrice: 159000, weightGram: 250, colors: [{ code: "WHT", name: "White" }] },
];

async function main() {
  // Admin default — GANTI password setelah login pertama
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@keytabee.com" },
    update: {},
    create: { email: "admin@keytabee.com", passwordHash, name: "Owner", role: "owner" },
  });

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        weightGram: p.weightGram,
      },
    });

    const sizes = p.oneSize ? [Size.OS] : SIZES;
    for (const color of p.colors) {
      for (const size of sizes) {
        const sku = `AIS-${p.category}${p.designNo}-${color.code}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            colorCode: color.code,
            colorName: color.name,
            size,
            stock: 10,
          },
        });
      }
    }
  }
  console.log("Seed selesai. Admin: admin@keytabee.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
