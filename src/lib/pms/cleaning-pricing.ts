export type CleaningPricing = {
  base_cop: number;
  guest_threshold: number;
  extra_per_guest_cop: number;
};

export const DEFAULT_CLEANING_PRICING: CleaningPricing = {
  base_cop: 50_000,
  guest_threshold: 4,
  extra_per_guest_cop: 10_000,
};

export function parseCleaningPricing(raw: unknown): CleaningPricing {
  if (!raw || typeof raw !== "object") return DEFAULT_CLEANING_PRICING;
  const o = raw as Record<string, unknown>;
  return {
    base_cop: Number(o.base_cop) || DEFAULT_CLEANING_PRICING.base_cop,
    guest_threshold:
      Number(o.guest_threshold) || DEFAULT_CLEANING_PRICING.guest_threshold,
    extra_per_guest_cop:
      Number(o.extra_per_guest_cop) ||
      DEFAULT_CLEANING_PRICING.extra_per_guest_cop,
  };
}

export function computeCleaningPrice(
  guests: number,
  rules: CleaningPricing,
): number {
  const g = Math.max(1, guests);
  let total = rules.base_cop;
  if (g > rules.guest_threshold) {
    total += (g - rules.guest_threshold) * rules.extra_per_guest_cop;
  }
  return Math.round(total);
}
