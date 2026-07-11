import { trackOrder, formatIDR } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
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
      <p className="py-16 text-center text-neutral-500">
        Order <b>{orderNumber}</b> tidak ditemukan.
      </p>
    );
  }

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-bold">Order {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-neutral-500">a.n. {order.guestName}</p>

      <div className="mt-6 rounded-lg border p-4">
        <div className="text-sm font-medium">
          Status: <span className="rounded bg-neutral-900 px-2 py-0.5 text-white">{STATUS_LABEL[order.status] ?? order.status}</span>
        </div>

        {stepIndex >= 0 && (
          <div className="mt-4 flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded ${i <= stepIndex ? "bg-neutral-900" : "bg-neutral-200"}`} />
                <div className="mt-1 text-center text-[10px] text-neutral-500">{STATUS_LABEL[s]}</div>
              </div>
            ))}
          </div>
        )}

        {order.status === "PENDING" && order.invoiceUrl && (
          <a href={order.invoiceUrl}
            className="mt-4 block rounded-lg bg-neutral-900 py-3 text-center text-white">
            Selesaikan Pembayaran
          </a>
        )}

        {order.waybill && (
          <p className="mt-4 text-sm">
            Resi <b>{order.courier.toUpperCase()}</b>: <code className="rounded bg-neutral-100 px-2 py-0.5">{order.waybill}</code>
          </p>
        )}
      </div>

      <div className="mt-6 rounded-lg border p-4 text-sm">
        {order.items.map((it: any) => (
          <div key={it.sku} className="flex justify-between py-1">
            <span>{it.name} × {it.qty}</span>
            <span>{formatIDR(it.price * it.qty)}</span>
          </div>
        ))}
        <div className="mt-3 border-t pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatIDR(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Ongkir ({order.courier.toUpperCase()} {order.courierService})</span><span>{formatIDR(order.shippingCost)}</span></div>
          <div className="mt-1 flex justify-between font-bold"><span>Total</span><span>{formatIDR(order.total)}</span></div>
        </div>
      </div>
    </div>
  );
}
