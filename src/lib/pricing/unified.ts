/**
 * Pricing unificado (Fase 5): rate plans + seasons → PricingConfig.
 * Reutiliza `quote()` / `publicStayQuote()` existentes.
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

/** Multiplicadores sugeridos por categoría marketing (sobre tarifa base). */
export const CATEGORY_RATE_MULTIPLIER: Record<MarketingCategory, number> = {
  vista: 1.0,
  atrio: 1.1,
  cielo: 1.2,
};

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

  if (params.categoryId && (!params.plans || params.plans.length === 0)) {
    const m = CATEGORY_RATE_MULTIPLIER[params.categoryId];
    cfg = {
      ...cfg,
      tarifaLJ: Math.round(cfg.tarifaLJ * m),
      tarifaVD: Math.round(cfg.tarifaVD * m),
    };
  }

  cfg = applySeasonMultiplier(cfg, params.input.checkIn, params.seasons ?? []);

  if (params.publicMode) {
    const r = publicStayQuote(params.input, {
      ...cfg,
      descuentoSemanal: 0,
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
