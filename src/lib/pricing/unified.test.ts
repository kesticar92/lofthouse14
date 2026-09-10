import { describe, expect, it } from "vitest";
import {
  applySeasonMultiplier,
  CATEGORY_RATE_MULTIPLIER,
  selectRatePlan,
  unifiedQuote,
  SEED_RATE_PLANS,
} from "./unified";
import { DEFAULT_PRICING } from "@/lib/pricing";

describe("unified pricing", () => {
  it("selecciona plan default", () => {
    expect(selectRatePlan(SEED_RATE_PLANS)?.code).toBe("BASE");
  });

  it("aplica temporada", () => {
    const cfg = applySeasonMultiplier(DEFAULT_PRICING, "2026-12-24", [
      {
        start_date: "2026-12-20",
        end_date: "2026-12-31",
        multiplier: 1.5,
      },
    ]);
    expect(cfg.tarifaLJ).toBe(Math.round(90_000 * 1.5));
  });

  it("Vista (120k) cotiza más que Cielo (90k), también con SEED plans", () => {
    const input = {
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
      huespedes: 2,
      lofts: 1,
    };
    const vista = unifiedQuote({
      input,
      categoryId: "vista",
      plans: SEED_RATE_PLANS,
      publicMode: true,
    });
    const cielo = unifiedQuote({
      input,
      categoryId: "cielo",
      plans: SEED_RATE_PLANS,
      publicMode: true,
    });
    expect(vista.ok && cielo.ok).toBe(true);
    if (vista.ok && cielo.ok) {
      // 1 L–J + 1 V–D: Vista 120k + ~133333; Cielo 90k + 100k
      expect(vista.subtotalAlojamiento).toBe(120_000 + Math.round(120_000 * (100_000 / 90_000)));
      expect(cielo.subtotalAlojamiento).toBe(190_000);
      expect(vista.totalReserva).toBeGreaterThan(cielo.totalReserva);
      expect(CATEGORY_RATE_MULTIPLIER.vista).toBeCloseTo(120_000 / 90_000);
      expect(CATEGORY_RATE_MULTIPLIER.cielo).toBe(1);
    }
  });
});
