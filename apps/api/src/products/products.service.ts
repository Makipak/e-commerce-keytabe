import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import axios from "axios";
import { buildSku, type Category, type ColorCode, type Size } from "@keytabee/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Buang cache ISR storefront untuk halaman yang terdampak perubahan.
   * Fire-and-forget: kegagalan revalidate tidak boleh menggagalkan operasi admin
   * (worst case: data baru muncul setelah window 60 detik seperti biasa).
   */
  private async revalidateWeb(productId?: string) {
    const web = process.env.FRONTEND_URL;
    const secret = process.env.REVALIDATE_SECRET;
    if (!web || !secret) return;
    const paths = ["/"];
    if (productId) {
      const p = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { slug: true },
      });
      if (p) paths.push(`/products/${p.slug}`);
    }
    axios
      .post(`${web}/api/revalidate`, { paths }, {
        headers: { "x-revalidate-secret": secret },
        timeout: 5000,
      })
      .catch((e) => this.logger.warn(`Revalidate storefront gagal: ${e.message}`));
  }

  /** Katalog publik: hanya produk aktif */
  async findPublic(params: { category?: string; search?: string; page?: number; pageSize?: number }) {
    const { category, search, page = 1, pageSize = 12 } = params;
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category ? { category: category as any } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 2 },
          variants: { select: { colorCode: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: data.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        categoryLabel: p.categoryLabel,
        basePrice: p.basePrice,
        thumbnailUrl: p.images.find((i) => i.type === "flat")?.url ?? p.images[0]?.url ?? null,
        colorCodes: [...new Set(p.variants.map((v) => v.colorCode))],
      })),
      total,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        variants: { orderBy: [{ colorCode: "asc" }, { size: "asc" }] },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) throw new NotFoundException("Produk tidak ditemukan");
    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        price: v.price ?? product.basePrice,
      })),
    };
  }

  // ===== Admin CRUD (dipanggil dari AdminProductsController, JWT-guarded) =====

  findAllAdmin(params: { search?: string; page?: number; pageSize?: number }) {
    const { search, page = 1, pageSize = 20 } = params;
    const where: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {};
    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { variants: true, images: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  findOneAdmin(id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: { variants: true, images: true },
    });
  }

  async create(data: Omit<Prisma.ProductCreateInput, "designNo">) {
    // Kategori "Lainnya" (OTH) dipakai bareng oleh banyak nama kategori custom yang beda —
    // scope nomor desain per categoryLabel juga, biar SKU tiap kategori custom mulai dari 1
    // lagi, bukan nyambung dengan kategori custom lain yang kebetulan sama-sama OTH.
    const last = await this.prisma.product.findFirst({
      where:
        data.category === "OTH"
          ? { category: "OTH", categoryLabel: data.categoryLabel as string | null }
          : { category: data.category },
      orderBy: { designNo: "desc" },
      select: { designNo: true },
    });
    const product = await this.prisma.product.create({
      data: { ...data, designNo: (last?.designNo ?? 0) + 1 },
    });
    void this.revalidateWeb(product.id);
    return product;
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    const product = await this.prisma.product.update({ where: { id }, data });
    void this.revalidateWeb(id);
    return product;
  }

  /**
   * Hybrid delete:
   * - Belum pernah dibeli → hard delete (varian & gambar ikut terhapus via cascade)
   * - Sudah ada riwayat order → soft delete (nonaktif), demi integritas
   *   histori order & laporan penjualan
   */
  async remove(id: string) {
    const orderCount = await this.prisma.orderItem.count({
      where: { variant: { productId: id } },
    });
    if (orderCount === 0) {
      const deleted = await this.prisma.product.delete({ where: { id } });
      void this.revalidateWeb();
      return { ...deleted, deleted: true };
    }
    const archived = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    void this.revalidateWeb(id);
    return { ...archived, deleted: false, orderCount };
  }

  async createVariant(
    productId: string,
    data: Omit<Prisma.ProductVariantUncheckedCreateInput, "productId" | "sku">,
  ) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { category: true, designNo: true },
    });
    const sku = buildSku(
      product.category as Category,
      product.designNo,
      data.colorCode as ColorCode,
      data.size as Size,
    );
    const variant = await this.prisma.productVariant.create({
      data: { ...data, sku, productId },
    });
    void this.revalidateWeb(productId);
    return variant;
  }

  async updateVariant(variantId: string, data: Prisma.ProductVariantUpdateInput) {
    const variant = await this.prisma.productVariant.update({ where: { id: variantId }, data });
    void this.revalidateWeb(variant.productId);
    return variant;
  }

  /** Hapus varian — ditolak kalau sudah punya riwayat order (jaga integritas laporan) */
  async removeVariant(variantId: string) {
    const orderCount = await this.prisma.orderItem.count({ where: { variantId } });
    if (orderCount > 0) {
      throw new BadRequestException(
        `Varian ini punya ${orderCount} riwayat order — tidak bisa dihapus. Set stok ke 0 agar tidak bisa dibeli.`,
      );
    }
    const variant = await this.prisma.productVariant.delete({ where: { id: variantId } });
    void this.revalidateWeb(variant.productId);
    return variant;
  }

  /**
   * Satu slot per kombinasi (colorCode, view, type) per produk.
   * Upload dengan kombinasi yang sudah ada → replace URL-nya (bukan duplikat).
   */
  async addImage(
    productId: string,
    data: Omit<Prisma.ProductImageUncheckedCreateInput, "productId">,
  ) {
    const existing = await this.prisma.productImage.findFirst({
      where: {
        productId,
        colorCode: data.colorCode as string,
        view: data.view as string,
        type: data.type as string,
      },
    });
    if (existing) {
      const updated = await this.prisma.productImage.update({
        where: { id: existing.id },
        data: { url: data.url as string },
      });
      void this.revalidateWeb(productId);
      return { ...updated, replaced: true };
    }
    const created = await this.prisma.productImage.create({
      data: { ...data, productId },
    });
    void this.revalidateWeb(productId);
    return { ...created, replaced: false };
  }

  async removeImage(imageId: string) {
    const image = await this.prisma.productImage.delete({ where: { id: imageId } });
    void this.revalidateWeb(image.productId);
    return image;
  }
}
