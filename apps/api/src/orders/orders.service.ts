import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { XenditService } from "../payments/xendit.service";
import { ShippingService } from "../shipping/shipping.service";
import { FonnteService } from "../notifications/fonnte.service";
import { CreateOrderDto } from "./dto/create-order.dto";

/** Auto-complete order SHIPPED kalau customer tidak konfirmasi manual dalam N hari */
const AUTO_COMPLETE_DAYS = 7;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private xendit: XenditService,
    private shipping: ShippingService,
    private wa: FonnteService,
  ) {}

  /**
   * Checkout guest. Prinsip keamanan:
   * - Harga TIDAK dipercaya dari client → re-fetch dari DB.
   * - Ongkir TIDAK dipercaya dari client → re-hitung ke Komerce.
   * - Stok dikurangi dgn guard `stock >= qty` dalam transaksi (anti race).
   */
  async create(dto: CreateOrderDto) {
    // 1. Ambil varian + produk dari DB
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException("Ada produk yang tidak ditemukan");
    }
    const byId = new Map(variants.map((v) => [v.id, v]));

    // 2. Hitung subtotal & berat dari data DB (bukan dari client)
    let subtotal = 0;
    let weightGram = 0;
    for (const item of dto.items) {
      const v = byId.get(item.variantId)!;
      if (!v.product.isActive) {
        throw new BadRequestException(`${v.product.name} sudah tidak tersedia`);
      }
      subtotal += (v.price ?? v.product.basePrice) * item.qty;
      weightGram += v.product.weightGram * item.qty;
    }

    // 3. Re-validasi ongkir ke Komerce
    const shippingCost = await this.shipping.getCostFor(
      dto.districtId,
      weightGram,
      dto.courier,
      dto.courierService,
    );
    if (shippingCost === null) {
      throw new BadRequestException("Layanan pengiriman tidak valid");
    }
    const total = subtotal + shippingCost;

    // 4. Transaksi: kurangi stok (guarded) + buat order PENDING
    const orderNumber = await this.generateOrderNumber();
    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        // Guard anti-oversell: hanya berkurang jika stok cukup
        const res = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (res.count === 0) {
          const v = byId.get(item.variantId)!;
          throw new ConflictException(
            `Stok ${v.product.name} (${v.sku}) tidak mencukupi`,
          );
        }
      }
      return tx.order.create({
        data: {
          orderNumber,
          guestName: dto.guestName,
          guestPhone: dto.guestPhone,
          guestEmail: dto.guestEmail,
          address: dto.address,
          provinceId: dto.provinceId,
          cityId: dto.cityId,
          districtId: dto.districtId,
          postalCode: dto.postalCode,
          subtotal,
          shippingCost,
          total,
          courier: dto.courier,
          courierService: dto.courierService,
          items: {
            create: dto.items.map((item) => {
              const v = byId.get(item.variantId)!;
              return {
                variantId: v.id,
                sku: v.sku,
                name: `${v.product.name} - ${v.colorName} / ${v.size}`,
                price: v.price ?? v.product.basePrice,
                qty: item.qty,
              };
            }),
          },
        },
      });
    });

    // 5. Create invoice Xendit (di luar transaksi DB — kalau gagal, batalkan order)
    try {
      const invoice = await this.xendit.createInvoice({
        orderNumber,
        amount: total,
        payerEmail: dto.guestEmail,
        description: `Order ${orderNumber} - Aissential`,
      });
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          xenditInvoiceId: invoice.id,
          xenditInvoiceUrl: invoice.invoiceUrl,
          expiredAt: new Date(invoice.expiryDate),
        },
      });
      return { orderNumber, invoiceUrl: invoice.invoiceUrl, total };
    } catch (e) {
      this.logger.error(`Gagal create invoice Xendit utk ${orderNumber}: ${e}`);
      await this.releaseStockAndSetStatus(order.id, OrderStatus.CANCELLED);
      throw new BadRequestException(
        "Gagal membuat pembayaran, silakan coba lagi",
      );
    }
  }

  /** Tracking publik — data terbatas, tanpa alamat lengkap */
  async track(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order tidak ditemukan");
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      guestName: order.guestName,
      items: order.items.map(({ sku, name, price, qty }) => ({ sku, name, price, qty })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      courier: order.courier,
      courierService: order.courierService,
      waybill: order.waybill,
      invoiceUrl: order.status === OrderStatus.PENDING ? order.xenditInvoiceUrl : null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
    };
  }

  /** Konfirmasi "pesanan diterima" oleh customer sendiri lewat halaman tracking publik */
  async confirmReceived(orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException("Order tidak ditemukan");
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(
        "Pesanan cuma bisa dikonfirmasi selesai saat statusnya sedang dikirim",
      );
    }
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETED },
    });
    void this.wa.notifyOrderCompleted(updated);
    return { orderNumber: updated.orderNumber, status: updated.status };
  }

  // ===== Dipanggil webhook Xendit (harus idempotent) =====

  async markPaid(orderNumber: string, paidAt: Date) {
    // Idempotent: hanya transisi dari PENDING
    const res = await this.prisma.order.updateMany({
      where: { orderNumber, status: OrderStatus.PENDING },
      data: { status: OrderStatus.PAID, paidAt },
    });
    if (res.count === 0) return; // sudah diproses / bukan PENDING — no-op

    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (order) {
      // fire-and-forget: WA gagal tidak menggagalkan webhook
      void this.wa.notifyOrderPaid(order);
    }
  }

  async markExpired(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, status: true, guestName: true, guestPhone: true },
    });
    if (!order || order.status !== OrderStatus.PENDING) return; // idempotent
    await this.releaseStockAndSetStatus(order.id, OrderStatus.EXPIRED);
    void this.wa.notifyOrderExpired({ orderNumber, guestName: order.guestName, guestPhone: order.guestPhone });
  }

  /** Kembalikan stok + set status akhir, dalam satu transaksi */
  private async releaseStockAndSetStatus(orderId: string, status: OrderStatus) {
    await this.prisma.$transaction(async (tx) => {
      // Guard idempotency di level transaksi
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING },
        data: { status },
      });
      if (updated.count === 0) return;
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }
    });
  }

  /**
   * Sweeper cadangan: kalau webhook expired tidak sampai,
   * order PENDING yang lewat expiredAt tetap di-release.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sweepExpiredOrders() {
    const stale = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING, expiredAt: { lt: new Date() } },
      select: { id: true, orderNumber: true, guestName: true, guestPhone: true },
    });
    for (const o of stale) {
      this.logger.log(`Sweeper: release order expired ${o.orderNumber}`);
      await this.releaseStockAndSetStatus(o.id, OrderStatus.EXPIRED);
      void this.wa.notifyOrderExpired(o);
    }
  }

  /**
   * Sweeper: order SHIPPED yang tidak dikonfirmasi customer dalam
   * AUTO_COMPLETE_DAYS hari otomatis ditandai selesai (mirror Shopee/Tokopedia).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sweepAutoCompleteOrders() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - AUTO_COMPLETE_DAYS);
    const stale = await this.prisma.order.findMany({
      where: { status: OrderStatus.SHIPPED, shippedAt: { lt: threshold } },
    });
    for (const o of stale) {
      this.logger.log(`Sweeper: auto-complete order ${o.orderNumber}`);
      const updated = await this.prisma.order.update({
        where: { id: o.id },
        data: { status: OrderStatus.COMPLETED },
      });
      void this.wa.notifyOrderCompleted(updated);
    }
  }

  // ===== Admin =====

  async findAllAdmin(params: { status?: string; page?: number; pageSize?: number }) {
    const { status, page = 1, pageSize = 20 } = params;
    const where: Prisma.OrderWhereInput = status
      ? { status: status as OrderStatus }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, total };
  }

  findOneAdmin(id: string) {
    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        items: true,
        waNotifications: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  /** Transisi status oleh admin. SHIPPED wajib bawa waybill. */
  async updateStatus(id: string, status: OrderStatus, waybill?: string) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id } });

    const allowed: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CANCELLED],
      PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      SHIPPED: [OrderStatus.COMPLETED],
      COMPLETED: [],
      CANCELLED: [],
      EXPIRED: [],
    };
    if (!allowed[order.status].includes(status)) {
      throw new BadRequestException(
        `Transisi ${order.status} → ${status} tidak diizinkan`,
      );
    }
    if (status === OrderStatus.SHIPPED && !waybill) {
      throw new BadRequestException("No. resi (waybill) wajib diisi saat SHIPPED");
    }

    // Cancel dari PENDING → kembalikan stok
    if (status === OrderStatus.CANCELLED && order.status === OrderStatus.PENDING) {
      await this.releaseStockAndSetStatus(order.id, OrderStatus.CANCELLED);
      void this.wa.notifyOrderCancelled(order);
      return this.findOneAdmin(id);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(waybill ? { waybill } : {}),
        ...(status === OrderStatus.SHIPPED ? { shippedAt: new Date() } : {}),
      },
    });

    if (status === OrderStatus.SHIPPED && waybill) {
      void this.wa.notifyOrderShipped({ ...updated, waybill });
    } else if (status === OrderStatus.PROCESSING) {
      void this.wa.notifyOrderProcessing(updated);
    } else if (status === OrderStatus.COMPLETED) {
      void this.wa.notifyOrderCompleted(updated);
    } else if (status === OrderStatus.CANCELLED) {
      void this.wa.notifyOrderCancelled(updated);
    }
    return updated;
  }

  /** Nomor order: KTB-YYYYMMDD-XXXX (sequence per hari) */
  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const countToday = await this.prisma.order.count({
      where: { createdAt: { gte: startOfDay } },
    });
    const seq = String(countToday + 1).padStart(4, "0");
    return `KTB-${ymd}-${seq}`;
  }
}
