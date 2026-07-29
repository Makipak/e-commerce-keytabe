import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Notifikasi WhatsApp via Fonnte (https://fonnte.com).
 * Fire-and-forget: kegagalan kirim WA TIDAK boleh menggagalkan flow order —
 * cukup di-log (server log + tabel WaNotificationLog) untuk ditindaklanjuti manual.
 */
@Injectable()
export class FonnteService {
  private readonly logger = new Logger(FonnteService.name);

  constructor(private prisma: PrismaService) {}

  /** Kirim + catat hasilnya. `orderNumber`/`event` opsional — dipakai buat log per-order di admin panel. */
  private async send(
    target: string,
    message: string,
    ctx?: { orderNumber: string; event: string },
  ): Promise<void> {
    const token = process.env.FONNTE_TOKEN;
    let success = false;
    let errorMessage: string | undefined;

    if (!token) {
      errorMessage = "FONNTE_TOKEN belum di-set";
      this.logger.warn("FONNTE_TOKEN belum di-set — skip notifikasi WA");
    } else {
      try {
        await axios.post(
          "https://api.fonnte.com/send",
          { target, message },
          { headers: { Authorization: token }, timeout: 10_000 },
        );
        success = true;
      } catch (e: any) {
        errorMessage = e?.response?.data?.reason ?? e?.message ?? String(e);
        this.logger.error(`Gagal kirim WA ke ${target}: ${errorMessage}`);
      }
    }

    if (ctx) {
      try {
        await this.prisma.waNotificationLog.create({
          data: { orderNumber: ctx.orderNumber, event: ctx.event, target, success, errorMessage },
        });
      } catch (e) {
        this.logger.error(`Gagal simpan log notifikasi WA: ${e}`);
      }
    }
  }

  async notifyOrderPaid(order: {
    orderNumber: string;
    guestName: string;
    guestPhone: string;
    total: number;
  }): Promise<void> {
    const trackUrl = `${process.env.FRONTEND_URL}/track/${order.orderNumber}`;
    await this.send(
      order.guestPhone,
      `Halo ${order.guestName}! Pembayaran order *${order.orderNumber}* sebesar Rp${order.total.toLocaleString("id-ID")} sudah kami terima. Pesananmu segera diproses.\n\nLacak status: ${trackUrl}`,
      { orderNumber: order.orderNumber, event: "PAID" },
    );
    const ownerWa = process.env.OWNER_WA_NUMBER;
    if (ownerWa) {
      await this.send(
        ownerWa,
        `[ORDER BARU] ${order.orderNumber} — ${order.guestName} — Rp${order.total.toLocaleString("id-ID")}. Cek admin panel untuk proses.`,
      );
    }
  }

  async notifyOrderShipped(order: {
    orderNumber: string;
    guestName: string;
    guestPhone: string;
    courier: string;
    waybill: string;
  }): Promise<void> {
    await this.send(
      order.guestPhone,
      `Halo ${order.guestName}! Order *${order.orderNumber}* sudah dikirim via ${order.courier.toUpperCase()}.\nNo. resi: *${order.waybill}*`,
      { orderNumber: order.orderNumber, event: "SHIPPED" },
    );
  }

  async notifyOrderProcessing(order: {
    orderNumber: string;
    guestName: string;
    guestPhone: string;
  }): Promise<void> {
    await this.send(
      order.guestPhone,
      `Halo ${order.guestName}! Order *${order.orderNumber}* sedang kami siapkan & packing. Kami kabari lagi begitu resi terbit ya 🙏`,
      { orderNumber: order.orderNumber, event: "PROCESSING" },
    );
  }

  async notifyOrderCompleted(order: {
    orderNumber: string;
    guestName: string;
    guestPhone: string;
  }): Promise<void> {
    await this.send(
      order.guestPhone,
      `Halo ${order.guestName}! Order *${order.orderNumber}* sudah sampai tujuan. Terima kasih sudah belanja di Aissential × aissential! Ditunggu order berikutnya 😊`,
      { orderNumber: order.orderNumber, event: "COMPLETED" },
    );
  }

  async notifyOrderCancelled(order: {
    orderNumber: string;
    guestName: string;
    guestPhone: string;
  }): Promise<void> {
    await this.send(
      order.guestPhone,
      `Halo ${order.guestName}, order *${order.orderNumber}* dibatalkan. Kalau ini kekeliruan atau kamu sudah terlanjur bayar, langsung balas chat ini ya biar kami bantu proses.`,
      { orderNumber: order.orderNumber, event: "CANCELLED" },
    );
  }

  async notifyOrderExpired(order: {
    orderNumber: string;
    guestName: string;
    guestPhone: string;
  }): Promise<void> {
    await this.send(
      order.guestPhone,
      `Halo ${order.guestName}, invoice order *${order.orderNumber}* sudah kedaluwarsa karena belum ada pembayaran. Silakan checkout ulang kalau masih berminat ya!`,
      { orderNumber: order.orderNumber, event: "EXPIRED" },
    );
  }
}
