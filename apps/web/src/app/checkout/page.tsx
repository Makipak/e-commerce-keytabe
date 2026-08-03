"use client";

/**
 * Checkout guest (tanpa login) — flow seperti ncrsport:
 * data diri + alamat (provinsi→kota→kecamatan utk RajaOngkir) → pilih kurir →
 * POST /orders → redirect ke halaman pembayaran Xendit.
 */
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/button";
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
type FieldErrors = Partial<Record<"name" | "whatsapp" | "address" | "province" | "city" | "district" | "shipping", string>>;

const inputBase = "w-full box-border h-[46px] px-3.5 text-sm bg-keytabee-surface font-sans";
const inputBorder = (hasError?: boolean) => (hasError ? "border border-keytabee-danger" : "border border-keytabee-border");

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    return (
      <div className="flex flex-col items-center px-10 py-24 text-center sm:py-32">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="mb-4 text-keytabee-disabled sm:mb-5 sm:h-[60px] sm:w-[60px]">
          <path d="M6 8h12l-1.2 11.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth={1.6} />
        </svg>
        <p className="mb-1.5 text-[15px] font-semibold sm:text-lg">Keranjang kamu masih kosong</p>
        <p className="mb-5 text-[13px] text-keytabee-ink-muted sm:mb-6 sm:text-sm">Yuk lihat koleksi terbaru dulu.</p>
        <Button href="/" variant="primary">
          Mulai Belanja
        </Button>
      </div>
    );
  }

  const total = subtotal + (service?.cost ?? 0);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.guestName.trim().length < 2) errors.name = "Nama wajib diisi";
    if (form.guestPhone.trim().length < 9) errors.whatsapp = "No. WhatsApp wajib diisi";
    if (form.address.trim().length < 10) errors.address = "Alamat wajib diisi";
    if (!provinceId) errors.province = "Pilih provinsi";
    if (!cityId) errors.city = "Pilih kota";
    if (!districtId) errors.district = "Pilih kecamatan";
    if (!service) errors.shipping = "Pilih kurir & layanan";
    return errors;
  };

  const submit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !service) return;

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

  const sectionLabel = "mb-3 text-xs font-semibold uppercase tracking-wide text-keytabee-ink-muted sm:mb-3.5";

  const summary = (
    <>
      <div className="mb-5 text-base font-semibold sm:mb-5">Ringkasan Pesanan</div>
      <div className="mb-2.5 flex justify-between text-sm text-keytabee-ink-muted sm:mb-4">
        <span>Subtotal</span>
        <span>{formatIDR(subtotal)}</span>
      </div>
      <div className="mb-4 flex justify-between text-sm text-keytabee-ink-muted sm:mb-4">
        <span>Ongkir</span>
        <span>{service ? formatIDR(service.cost) : "—"}</span>
      </div>
      <div className="mb-5 flex justify-between border-t border-keytabee-border pt-4 text-base font-semibold sm:mb-6 sm:text-[17px]">
        <span>Total</span>
        <span>{formatIDR(total)}</span>
      </div>
      {error && <p className="mb-3 text-[13px] text-keytabee-danger">{error}</p>}
      <Button
        onClick={submit}
        disabled={loading}
        variant="primary"
        size="lg"
        fullWidth
        className="mb-2.5 sm:mb-3"
      >
        {loading ? "Memproses..." : "Lanjut ke Pembayaran"}
      </Button>
      <p className="text-center text-[11px] leading-relaxed text-keytabee-ink-muted">
        Kamu akan diarahkan ke halaman pembayaran Xendit (VA/QRIS/e-wallet/retail).
      </p>
    </>
  );

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_380px] md:items-start md:gap-16">
      <div>
        <h1 className="mb-6 text-xl font-bold tracking-tight sm:mb-8 sm:text-[26px]">Checkout</h1>

        <div className={sectionLabel}>Data Pembeli</div>
        <div className="mb-4 grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          <div>
            <input
              className={`${inputBase} ${inputBorder(!!fieldErrors.name)}`}
              placeholder="Nama lengkap"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            />
            {fieldErrors.name && <p className="mt-1 text-[11px] text-keytabee-danger">{fieldErrors.name}</p>}
          </div>
          <div>
            <input
              className={`${inputBase} ${inputBorder(!!fieldErrors.whatsapp)}`}
              placeholder="No. WhatsApp"
              value={form.guestPhone}
              onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
            />
            {fieldErrors.whatsapp && <p className="mt-1 text-[11px] text-keytabee-danger">{fieldErrors.whatsapp}</p>}
          </div>
        </div>
        <p className="mb-4 -mt-2 text-[11px] text-keytabee-ink-muted sm:mb-8">
          No. WhatsApp adalah kanal notifikasi status pesanan utama.
        </p>
        <input
          className={`${inputBase} ${inputBorder()} mb-6 sm:mb-8`}
          placeholder="Email (opsional)"
          type="email"
          value={form.guestEmail}
          onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
        />

        <div className={sectionLabel}>Alamat</div>
        <div className="mb-3.5 sm:mb-4">
          <textarea
            className={`${inputBase} h-auto box-border resize-none py-3 ${inputBorder(!!fieldErrors.address)}`}
            rows={3}
            placeholder="Alamat lengkap (nama jalan, no. rumah, RT/RW)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          {fieldErrors.address && <p className="mt-1 text-[11px] text-keytabee-danger">{fieldErrors.address}</p>}
        </div>
        <div className="mb-6 grid gap-3 sm:mb-9 sm:grid-cols-3 sm:gap-4">
          <select
            className={`${inputBase} ${inputBorder(!!fieldErrors.province)}`}
            value={provinceId}
            onChange={(e) => setProvinceId(Number(e.target.value))}
          >
            <option value={0}>Provinsi</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            className={`${inputBase} ${inputBorder(!!fieldErrors.city)} ${!provinceId ? "bg-keytabee-surface-muted text-keytabee-disabled" : ""}`}
            value={cityId}
            disabled={!cities.length}
            onChange={(e) => setCityId(Number(e.target.value))}
          >
            <option value={0}>{provinceId ? "Kota / Kabupaten" : "Pilih provinsi dulu"}</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className={`${inputBase} ${inputBorder(!!fieldErrors.district)} ${!cityId ? "bg-keytabee-surface-muted text-keytabee-disabled" : ""}`}
            value={districtId}
            disabled={!districts.length}
            onChange={(e) => setDistrictId(Number(e.target.value))}
          >
            <option value={0}>{cityId ? "Kecamatan" : "Pilih kota dulu"}</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <input
          className={`${inputBase} ${inputBorder()} mb-6 sm:mb-9`}
          placeholder="Kode pos (opsional)"
          value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
        />

        <div className={sectionLabel}>Kurir</div>
        <div className="mb-3 flex gap-2">
          {COURIERS.map((c) => (
            <Button
              key={c}
              onClick={() => setCourier(c)}
              variant="toggle"
              active={courier === c}
              size="sm"
              className="uppercase"
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {options.map((o) => {
            const isSelected = service?.service === o.service;
            return (
              <div
                key={o.service}
                onClick={() => setService(o)}
                className={`flex cursor-pointer items-center justify-between border p-3.5 sm:p-4 ${
                  isSelected ? "border-keytabee-ink bg-keytabee-surface-muted" : "border-keytabee-border"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] sm:h-[18px] sm:w-[18px] ${
                      isSelected ? "border-keytabee-ink" : "border-keytabee-disabled"
                    }`}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-keytabee-ink sm:h-2.5 sm:w-2.5" />}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium sm:text-sm">
                      {o.courier.toUpperCase()} — {o.service}
                    </div>
                    <div className="text-[11px] text-keytabee-ink-muted sm:text-xs">
                      {o.description} · Estimasi {o.etd}
                    </div>
                  </div>
                </div>
                <div className="text-[13px] font-medium sm:text-sm">{formatIDR(o.cost)}</div>
              </div>
            );
          })}
          {fieldErrors.shipping && <p className="text-[11px] text-keytabee-danger">{fieldErrors.shipping}</p>}
        </div>

        <div className="mt-6 border border-keytabee-border bg-keytabee-surface p-4 md:hidden">
          {summary}
        </div>
      </div>

      <div className="hidden border border-keytabee-border bg-keytabee-surface p-7 md:sticky md:top-[100px] md:block">
        {summary}
      </div>
    </div>
  );
}
