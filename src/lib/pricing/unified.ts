/**
 * Pricing unificado (Fase 5): rate plans + seasons → PricingConfig.
 * Reutiliza `quote()` / `publicStayQuote()` existentes.
 *
 * Categorías marketing (Vista / Atrio / Cielo) usan `priceFromCop` como
 * tarifa L–J; V–D mantiene el ratio del plan/base (p. ej. 100k/90k).
 */

import {
  DEFAULT_PRICING,
  quote,
  type PricingConfig,
  type QuoteInput,
  type QuoteResult,
} from "@/lib/pricing";
import { publicStayQuote } from "@/lib/public-stay-quote";
import type { MarketingCategory } from "@/lib/catalog/seed";
import { getLoftCategory } from "@/data/loft-categories";

export type RatePlanLike = {
  code: string;
  tarifa_lj: number;
  tarifa_vd: number;
  recargo_huesped: number;
  room_type_id?: string | null;
  is_default?: boolean;
  active?: boolean;
};

export type SeasonRuleLike = {
  start_date: string;
  end_date: string;
  multiplier: number;
  active?: boolean;
};

/**
 * Multiplicadores vs tarifa base Cielo (90k).
 * Vista 120k → 4/3 · Atrio 105k → 7/6 · Cielo 90k → 1.
 */
export const CATEGORY_RATE_MULTIPLIER: Record<MarketingCategory, number> = {
  cielo: 1,
  atrio: 105_000 / 90_000,
  vista: 120_000 / 90_000,
};

/** Ratio fin de semana del config (default 100k/90k). */
export function weekendRateRatio(cfg: PricingConfig = DEFAULT_PRICING): number {
  if (!cfg.tarifaLJ || cfg.tarifaLJ <= 0) return 100_000 / 90_000;
  return cfg.tarifaVD / cfg.tarifaLJ;
}

/**
 * Tarifas L–J / V–D para una categoría marketing (priceFromCop + ratio VD).
 */
export function pricingForMarketingCategory(
  categoryId: MarketingCategory,
  base: PricingConfig = DEFAULT_PRICING,
): Pick<PricingConfig, "tarifaLJ" | "tarifaVD"> {
  const priceFrom = getLoftCategory(categoryId).priceFromCop;
  const ratio = weekendRateRatio(base);
  return {
    tarifaLJ: priceFrom,
    tarifaVD: Math.round(priceFrom * ratio),
  };
}

/** PricingConfig público/completo amarrado a categoría (o base si null). */
export function pricingConfigForCategory(
  categoryId: MarketingCategory | null | undefined,
  base: PricingConfig = DEFAULT_PRICING,
): PricingConfig {
  if (!categoryId) return { ...base };
  const rates = pricingForMarketingCategory(categoryId, base);
  return { ...base, ...rates };
}

export function ratePlanToPricingConfig(
  plan: RatePlanLike | null | undefined,
  base: PricingConfig = DEFAULT_PRICING,
): PricingConfig {
  if (!plan) return { ...base };
  return {
    ...base,
    tarifaLJ: Number(plan.tarifa_lj) || base.tarifaLJ,
    tarifaVD: Number(plan.tarifa_vd) || base.tarifaVD,
    recargoHuesped: Number(plan.recargo_huesped) || base.recargoHuesped,
  };
}

export function applySeasonMultiplier(
  cfg: PricingConfig,
  checkIn: string,
  seasons: SeasonRuleLike[],
): PricingConfig {
  const hit = seasons.find(
    (s) =>
      (s.active !== false) &&
      s.start_date <= checkIn &&
      s.end_date >= checkIn,
  );
  if (!hit || !hit.multiplier || hit.multiplier === 1) return cfg;
  const m = Number(hit.multiplier);
  return {
    ...cfg,
    tarifaLJ: Math.round(cfg.tarifaLJ * m),
    tarifaVD: Math.round(cfg.tarifaVD * m),
  };
}

export function selectRatePlan(
  plans: RatePlanLike[],
  roomTypeId?: string | null,
): RatePlanLike | null {
  const active = plans.filter((p) => p.active !== false);
  if (roomTypeId) {
    const specific = active.find((p) => p.room_type_id === roomTypeId);
    if (specific) return specific;
  }
  return active.find((p) => p.is_default) ?? active[0] ?? null;
}

export function unifiedQuote(params: {
  input: QuoteInput;
  plans?: RatePlanLike[];
  seasons?: SeasonRuleLike[];
  roomTypeId?: string | null;
  categoryId?: MarketingCategory | null;
  publicMode?: boolean;
  appSettingsPricing?: Partial<PricingConfig> | null;
}): QuoteResult & { disclaimers?: string[]; ratePlanCode?: string } {
  const base: PricingConfig = {
    ...DEFAULT_PRICING,
    ...(params.appSettingsPricing ?? {}),
  };

  let cfg = ratePlanToPricingConfig(
    selectRatePlan(params.plans ?? [], params.roomTypeId),
    base,
  );

  // Categoría marketing siempre manda sobre el plan seed/base:
  // Vista 120k, Atrio 105k, Cielo 90k (+ ratio V–D del plan).
  if (params.categoryId) {
    cfg = {
      ...cfg,
      ...pricingForMarketingCategory(params.categoryId, cfg),
    };
  }

  cfg = applySeasonMultiplier(cfg, params.input.checkIn, params.seasons ?? []);

  if (params.publicMode) {
    const r = publicStayQuote(params.input, {
      ...cfg,
      descuentoSemanal: 0,
      descuentoQuincenal: 0,
      descuentoMensual: 0,
      comisionAirbnb: 0,
    });
    return r;
  }

  return quote(params.input, cfg);
}

/** Seed rate plan local (sin DB). */
export const SEED_RATE_PLANS: RatePlanLike[] = [
  {
    code: "BASE",
    tarifa_lj: 90_000,
    tarifa_vd: 100_000,
    recargo_huesped: 30_000,
    room_type_id: null,
    is_default: true,
    active: true,
  },
];
