"use client";

/**
 * Checkout guest (tanpa login) — flow seperti ncrsport:
 * data diri + alamat (provinsi→kota→kecamatan utk RajaOngkir) → pilih kurir →
 * POST /orders → redirect ke halaman pembayaran Xendit.
 */
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import {
  createOrder,
  formatIDR,
  getCities,
  getDistricts,
  getProvinces,
  getShippingCost,
} from "@/lib/api";
import type { ShippingCostOption } from "@keytabee/shared";

const COURIERS = ["jne", "sicepat", "jnt"]; // sesuaikan dgn yang diaktifkan di Komerce

interface Region { id: number; name: string }

export default function CheckoutPage() {
  const { lines, subtotal, totalWeight, clear } = useCart();

  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    address: "",
    postalCode: "",
  });
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [provinceId, setProvinceId] = useState(0);
  const [cityId, setCityId] = useState(0);
  const [districtId, setDistrictId] = useState(0);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [options, setOptions] = useState<ShippingCostOption[]>([]);
  const [service, setService] = useState<ShippingCostOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() =>
        setError("Gagal memuat data wilayah — cek koneksi API/konfigurasi ongkir"),
      );
  }, []);

  useEffect(() => {
    setCities([]); setDistricts([]); setCityId(0); setDistrictId(0); setOptions([]); setService(null);
    if (provinceId) getCities(provinceId).then(setCities).catch(() => setError("Gagal memuat kota"));
  }, [provinceId]);

  useEffect(() => {
    setDistricts([]); setDistrictId(0); setOptions([]); setService(null);
    if (cityId) getDistricts(cityId).then(setDistricts).catch(() => setError("Gagal memuat kecamatan"));
  }, [cityId]);

  useEffect(() => {
    setOptions([]); setService(null);
    if (districtId && totalWeight > 0) {
      getShippingCost({ districtId, weightGram: totalWeight, courier })
        .then(setOptions)
        .catch(() => setError("Gagal cek ongkir"));
    }
  }, [districtId, courier, totalWeight]);

  if (lines.length === 0) {
    return <p className="py-16 text-center text-neutral-500">Keranjang kosong.</p>;
  }

  const total = subtotal + (service?.cost ?? 0);
  const canSubmit =
    form.guestName.length >= 2 &&
    form.guestPhone.length >= 9 &&
    form.address.length >= 10 &&
    districtId > 0 &&
    service !== null &&
    !loading;

  const submit = async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createOrder({
        items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail || undefined,
        address: form.address,
        postalCode: form.postalCode || undefined,
        provinceId,
        cityId,
        districtId,
        courier,
        courierService: service.service,
      });
      clear();
      window.location.href = res.invoiceUrl; // → halaman pembayaran Xendit
    } catch (e: any) {
      setError(e.message ?? "Checkout gagal, coba lagi");
      setLoading(false);
    }
  };

  const input = "w-full rounded border px-3 py-2 text-sm";

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Checkout</h1>
        <input className={input} placeholder="Nama lengkap *" value={form.guestName}
          onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
        <input className={input} placeholder="No. WhatsApp * (mis. 08123456789)" value={form.guestPhone}
          onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
        <input className={input} placeholder="Email (opsional)" type="email" value={form.guestEmail}
          onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />

        <select className={input} value={provinceId} onChange={(e) => setProvinceId(Number(e.target.value))}>
          <option value={0}>Pilih Provinsi *</option>
          {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={input} value={cityId} disabled={!cities.length}
          onChange={(e) => setCityId(Number(e.target.value))}>
          <option value={0}>Pilih Kota/Kabupaten *</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={input} value={districtId} disabled={!districts.length}
          onChange={(e) => setDistrictId(Number(e.target.value))}>
          <option value={0}>Pilih Kecamatan *</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <textarea className={input} rows={3} placeholder="Alamat lengkap (jalan, RT/RW, patokan) *"
          value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className={input} placeholder="Kode pos (opsional)" value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />

        <div>
          <div className="mb-2 text-sm font-medium">Kurir</div>
          <div className="flex gap-2">
            {COURIERS.map((c) => (
              <button key={c} onClick={() => setCourier(c)}
                className={`rounded border px-3 py-1 text-sm uppercase ${courier === c ? "bg-neutral-900 text-white" : ""}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {options.length > 0 && (
          <div className="space-y-2">
            {options.map((o) => (
              <label key={o.service} className="flex cursor-pointer items-center justify-between rounded border p-3 text-sm">
                <span>
                  <input type="radio" name="service" className="mr-2"
                    checked={service?.service === o.service} onChange={() => setService(o)} />
                  {o.service} — {o.description} ({o.etd})
                </span>
                <span className="font-medium">{formatIDR(o.cost)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="h-fit rounded-lg border p-4">
        <h2 className="mb-4 font-semibold">Ringkasan</h2>
        {lines.map((l) => (
          <div key={l.variantId} className="flex justify-between py-1 text-sm">
            <span>{l.productName} ({l.size}) × {l.qty}</span>
            <span>{formatIDR(l.price * l.qty)}</span>
          </div>
        ))}
        <div className="mt-3 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
          <div className="flex justify-between">
            <span>Ongkir ({(totalWeight / 1000).toFixed(1)} kg)</span>
            <span>{service ? formatIDR(service.cost) : "—"}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-bold">
            <span>Total</span><span>{formatIDR(total)}</span>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button onClick={submit} disabled={!canSubmit}
          className="mt-4 w-full rounded-lg bg-neutral-900 py-3 text-white disabled:opacity-40">
          {loading ? "Memproses..." : "Bayar Sekarang"}
        </button>
        <p className="mt-2 text-center text-xs text-neutral-500">
          Kamu akan diarahkan ke halaman pembayaran (VA / QRIS / e-wallet).
        </p>
      </div>
    </div>
  );
}
