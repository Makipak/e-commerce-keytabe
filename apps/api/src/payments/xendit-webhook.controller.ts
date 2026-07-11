import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { XenditService } from "./xendit.service";
import { OrdersService } from "../orders/orders.service";

/**
 * Callback Xendit Invoice.
 * PENTING:
 * - Selalu balas 200 secepatnya; Xendit retry kalau non-2xx.
 * - Handler HARUS idempotent — Xendit bisa kirim event yang sama >1x.
 */
@Controller("webhooks/xendit")
export class XenditWebhookController {
  private readonly logger = new Logger(XenditWebhookController.name);

  constructor(
    private xendit: XenditService,
    private orders: OrdersService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers("x-callback-token") token: string | undefined,
    @Body() payload: any,
  ) {
    if (!this.xendit.verifyCallbackToken(token)) {
      throw new UnauthorizedException("Invalid callback token");
    }

    const orderNumber: string = payload.external_id;
    const status: string = payload.status; // PAID | EXPIRED | ...
    this.logger.log(`Webhook Xendit: ${orderNumber} → ${status}`);

    if (status === "PAID" || status === "SETTLED") {
      await this.orders.markPaid(orderNumber, new Date(payload.paid_at ?? Date.now()));
    } else if (status === "EXPIRED") {
      await this.orders.markExpired(orderNumber);
    }
    return { ok: true };
  }
}
