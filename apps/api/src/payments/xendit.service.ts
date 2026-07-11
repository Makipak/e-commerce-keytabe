import { Injectable } from "@nestjs/common";
import axios from "axios";

/**
 * Xendit Invoice API (https://developers.xendit.co/api-reference/#invoices).
 * Satu invoice URL meng-handle semua metode: VA, QRIS, e-wallet, retail.
 * Auth: Basic dengan secret key sebagai username, password kosong.
 */
@Injectable()
export class XenditService {
  private readonly http = axios.create({
    baseURL: "https://api.xendit.co",
    auth: { username: process.env.XENDIT_SECRET_KEY ?? "", password: "" },
    timeout: 15_000,
  });

  async createInvoice(params: {
    orderNumber: string;
    amount: number;
    payerEmail?: string;
    description: string;
  }): Promise<{ id: string; invoiceUrl: string; expiryDate: string }> {
    const res = await this.http.post("/v2/invoices", {
      external_id: params.orderNumber,
      amount: params.amount,
      description: params.description,
      invoice_duration: 24 * 60 * 60, // 24 jam — sinkron dgn kebijakan hold stok
      currency: "IDR",
      ...(params.payerEmail ? { payer_email: params.payerEmail } : {}),
      success_redirect_url: `${process.env.FRONTEND_URL}/track/${params.orderNumber}`,
      failure_redirect_url: `${process.env.FRONTEND_URL}/track/${params.orderNumber}`,
    });
    return {
      id: res.data.id,
      invoiceUrl: res.data.invoice_url,
      expiryDate: res.data.expiry_date,
    };
  }

  /** Guard webhook: Xendit mengirim token di header x-callback-token */
  verifyCallbackToken(token: string | undefined): boolean {
    return !!token && token === process.env.XENDIT_CALLBACK_TOKEN;
  }
}
