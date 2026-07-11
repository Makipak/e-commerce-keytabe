import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

/**
 * Notifikasi WhatsApp via Fonnte (https://fonnte.com).
 * Fire-and-forget: kegagalan kirim WA TIDAK boleh menggagalkan flow order —
 * cukup di-log untuk ditindaklanjuti manual.
 */
@Injectable()
export class FonnteService {
  private readonly logger = new Logger(FonnteService.name);

  async send(target: string, message: string): Promise<void> {
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      this.logger.warn("FONNTE_TOKEN belum di-set — skip notifikasi WA");
      return;
    }
    try {
      await axios.post(
        "https://api.fonnte.com/send",
        { target, message },
        { headers: { Authorization: token }, timeout: 10_000 },
      );
    } catch (e) {
      this.logger.error(`Gagal kirim WA ke ${target}: ${e}`);
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
    );
  }
}
