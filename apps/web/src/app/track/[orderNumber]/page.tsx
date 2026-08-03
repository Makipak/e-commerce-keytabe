import { trackOrder, formatIDR } from "@/lib/api";
import { CopyWaybillButton } from "@/components/copy-waybill-button";
import { ConfirmReceivedButton } from "@/components/confirm-received-button";
import { Button } from "@/components/button";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
};

const STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED"];

export const dynamic = "force-dynamic"; // status harus selalu fresh

export default async function TrackPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  let order: any;
  try {
    order = await trackOrder(orderNumber);
  } catch {
    return (
      <div className="flex flex-col items-center px-10 py-24 text-center sm:py-32">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="mb-4 text-keytabee-danger sm:mb-5 sm:h-14 sm:w-14">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth={1.6} />
          <path d="M12 7v6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>
        <p className="mb-1.5 text-[15px] font-semibold sm:text-lg">Pesanan tidak ditemukan</p>
        <p className="mb-5 max-w-sm text-[13px] leading-relaxed text-keytabee-ink-muted sm:mb-6 sm:text-sm">
          Order <b>{orderNumber}</b> tidak ditemukan, atau server sedang bermasalah. Periksa kembali nomor pesananmu.
        </p>
        <Button href="/" variant="primary">
          Kembali ke Katalog
        </Button>
      </div>
    );
  }

  const isCancelledState = order.status === "CANCELLED" || order.status === "EXPIRED";
  const currentIndex = STEPS.indexOf(order.status);
  const timeline = STEPS.map((s, i) => ({
    key: s,
    label: STATUS_LABEL[s],
    isDone: !isCancelledState && i <= currentIndex,
    isCurrent: !isCancelledState && i === currentIndex,
  }));
  const showWaybill = order.status === "SHIPPED" || order.status === "COMPLETED";
  const cancelledLabel = order.status === "CANCELLED" ? "Dibatalkan" : "Kedaluwarsa";
  const cancelledNote =
    order.status === "CANCELLED"
      ? "Pesanan ini telah dibatalkan. Jika ini tidak sesuai harapanmu, hubungi kami via WhatsApp."
      : "Waktu pembayaran telah habis dan pesanan ini kedaluwarsa. Silakan buat pesanan baru.";

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_380px] md:items-start md:gap-16">
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted">No. Pesanan</div>
        <div className="mb-6 text-xl font-bold tracking-tight sm:mb-8 sm:text-[28px]">{order.orderNumber}</div>

        {isCancelledState && (
          <div className="mb-6 border border-keytabee-danger bg-keytabee-danger/[0.08] p-4 sm:mb-8 sm:p-5">
            <div className="mb-2 text-sm font-semibold text-keytabee-danger sm:text-base">{cancelledLabel}</div>
            <div className="text-[13px] leading-relaxed text-keytabee-ink-muted sm:text-sm">{cancelledNote}</div>
          </div>
        )}

        <div className="relative mb-6 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:justify-between">
          <div className="hidden sm:absolute sm:left-5 sm:right-5 sm:top-[9px] sm:block sm:h-0.5 sm:bg-keytabee-border" />
          {timeline.map((step) => (
            <div key={step.key} className="relative z-10 flex items-center gap-3.5 sm:flex-1 sm:flex-col sm:gap-2.5">
              <div
                className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                  step.isDone ? "border-keytabee-ink bg-keytabee-ink" : "border-keytabee-border bg-white"
                }`}
              />
              <div
                className={`text-sm sm:text-center sm:text-[13px] ${step.isCurrent ? "font-semibold" : "font-medium"} ${
                  step.isDone ? "text-keytabee-ink" : "text-keytabee-disabled"
                }`}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {showWaybill && (
          <div className="mb-6 bg-keytabee-surface-muted p-4 sm:mb-9 sm:p-5">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted sm:mb-2">No. Resi</div>
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold sm:text-[17px]">{order.waybill}</div>
              <CopyWaybillButton waybill={order.waybill} />
            </div>
          </div>
        )}

        {order.status === "SHIPPED" && <ConfirmReceivedButton orderNumber={order.orderNumber} />}

        {order.status === "PENDING" && order.invoiceUrl && (
          <Button href={order.invoiceUrl} variant="primary" size="lg" fullWidth className="mb-6 sm:mb-9">
            Selesaikan Pembayaran
          </Button>
        )}

        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted sm:mb-4">Item Pesanan</div>
        <div className="mb-6 flex flex-col gap-3.5 sm:mb-9 sm:gap-4">
          {order.items.map((it: any) => (
            <div key={it.sku} className="flex items-center gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-keytabee-ink-muted sm:text-[13px]">× {it.qty}</div>
              </div>
              <div className="text-sm font-medium">{formatIDR(it.price * it.qty)}</div>
            </div>
          ))}
        </div>

        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted sm:mb-3">Alamat Kirim</div>
        <div className="text-sm leading-relaxed text-keytabee-ink-muted sm:max-w-[65ch]">{order.address}</div>
      </div>

      <div className="border border-keytabee-border bg-keytabee-surface p-5 sm:p-7 md:sticky md:top-[100px]">
        <div className="mb-4 text-base font-semibold sm:mb-5">Ringkasan</div>
        <div className="mb-2.5 flex justify-between text-sm text-keytabee-ink-muted sm:mb-4">
          <span>Subtotal</span>
          <span>{formatIDR(order.subtotal)}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm text-keytabee-ink-muted sm:mb-4">
          <span>
            Ongkir ({order.courier.toUpperCase()} {order.courierService})
          </span>
          <span>{formatIDR(order.shippingCost)}</span>
        </div>
        <div className="mb-5 flex justify-between border-t border-keytabee-border pt-4 text-base font-semibold sm:mb-5 sm:text-[17px]">
          <span>Total</span>
          <span>{formatIDR(order.total)}</span>
        </div>
        <p className="text-center text-xs leading-relaxed text-keytabee-ink-muted">
          Halaman ini publik — hanya bisa diakses dengan tautan atau nomor pesananmu.
        </p>
      </div>
    </div>
  );
}
