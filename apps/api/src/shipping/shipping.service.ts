import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";

/**
 * RajaOngkir via Komerce (rajaongkir.komerce.id).
 * ⚠️ API lama api.rajaongkir.com sudah deprecated.
 * TODO: verifikasi base URL & bentuk response terbaru di dokumentasi Komerce
 * (https://rajaongkir.komerce.id) saat sudah punya API key.
 */
@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly http = axios.create({
    baseURL: "https://rajaongkir.komerce.id/api/v1",
    headers: { key: process.env.KOMERCE_API_KEY ?? "" },
    timeout: 10_000,
  });

  // Cache in-memory sederhana — data wilayah jarang berubah.
  private cache = new Map<string, { at: number; data: unknown }>();
  private readonly TTL = 24 * 60 * 60 * 1000;

  private async cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.TTL) return hit.data as T;
    const data = await fetcher();
    this.cache.set(key, { at: Date.now(), data });
    return data;
  }

  /** Normalisasi respons wilayah ke { id, name } — nama field Komerce bisa beda-beda */
  private toRegions(rows: any[]): { id: number; name: string }[] {
    return (rows ?? []).map((r) => ({
      id: r.id ?? r.province_id ?? r.city_id ?? r.district_id,
      name:
        r.name ?? r.province_name ?? r.city_name ?? r.district_name ?? r.province ?? r.city,
    }));
  }

  getProvinces() {
    return this.cached("provinces", async () => {
      const res = await this.http.get("/destination/province");
      return this.toRegions(res.data.data);
    });
  }

  getCities(provinceId: number) {
    return this.cached(`cities:${provinceId}`, async () => {
      const res = await this.http.get(`/destination/city/${provinceId}`);
      return this.toRegions(res.data.data);
    });
  }

  getDistricts(cityId: number) {
    return this.cached(`districts:${cityId}`, async () => {
      const res = await this.http.get(`/destination/district/${cityId}`);
      return this.toRegions(res.data.data);
    });
  }

  // Kelas layanan kargo/trucking (mis. JNE JTR) tidak relevan untuk paket kecil toko ini.
  private readonly EXCLUDED_SERVICE_KEYWORDS = ["trucking", "cargo", "kargo", "jtr"];

  private isExcludedService(service: string, description: string): boolean {
    const text = `${service} ${description}`.toLowerCase();
    return this.EXCLUDED_SERVICE_KEYWORDS.some((kw) => text.includes(kw));
  }

  /**
   * Hitung ongkir. origin = SHIPPING_ORIGIN_DISTRICT_ID (kecamatan asal toko).
   * Return: daftar layanan { courier, service, description, cost, etd }, sudah
   * difilter dari layanan kargo/trucking yang tidak relevan untuk paket kecil.
   */
  async calculateCost(params: { districtId: number; weightGram: number; courier: string }) {
    const origin = process.env.SHIPPING_ORIGIN_DISTRICT_ID;
    const res = await this.http.post(
      "/calculate/district/domestic-cost",
      new URLSearchParams({
        origin: String(origin),
        destination: String(params.districtId),
        weight: String(params.weightGram),
        courier: params.courier,
      }),
    );
    // TODO: sesuaikan mapping dgn bentuk response Komerce sebenarnya
    return (res.data.data ?? [])
      .map((row: any) => ({
        courier: params.courier,
        service: row.service,
        description: row.description,
        cost: row.cost,
        etd: row.etd,
      }))
      .filter((opt: any) => !this.isExcludedService(opt.service ?? "", opt.description ?? ""));
  }

  /** Dipakai OrdersService: re-validasi ongkir yang diklaim client */
  async getCostFor(districtId: number, weightGram: number, courier: string, service: string): Promise<number | null> {
    try {
      const options = await this.calculateCost({ districtId, weightGram, courier });
      const found = options.find((o: any) => o.service === service);
      return found ? found.cost : null;
    } catch (e) {
      this.logger.error(`Gagal hitung ongkir: ${e}`);
      return null;
    }
  }
}
