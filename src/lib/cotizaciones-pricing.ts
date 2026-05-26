import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

export { DEFAULT_PRICING };

export function parseCotizacionesPricing(raw: unknown): PricingConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_PRICING;
  const o = raw as Record<string, unknown>;
  return {
    tarifaLJ: num(o.tarifaLJ, DEFAULT_PRICING.tarifaLJ),
    tarifaVD: num(o.tarifaVD, DEFAULT_PRICING.tarifaVD),
    recargoHuesped: num(o.recargoHuesped, DEFAULT_PRICING.recargoHuesped),
    aseoCorta: num(o.aseoCorta, DEFAULT_PRICING.aseoCorta),
    aseoMedia: num(o.aseoMedia, DEFAULT_PRICING.aseoMedia),
    aseoSemanal: num(o.aseoSemanal, DEFAULT_PRICING.aseoSemanal),
    descuentoSemanal: ratio(
      o.descuentoSemanal,
      DEFAULT_PRICING.descuentoSemanal,
    ),
    descuentoMensual: ratio(
      o.descuentoMensual,
      DEFAULT_PRICING.descuentoMensual,
    ),
  };
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function ratio(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}
