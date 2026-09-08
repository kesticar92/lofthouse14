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

  it("cotiza con categoría cielo más cara que vista (sin plans DB)", () => {
    const vista = unifiedQuote({
      input: {
        checkIn: "2026-03-02",
        checkOut: "2026-03-04",
        huespedes: 2,
        lofts: 1,
      },
      categoryId: "vista",
      publicMode: true,
    });
    const cielo = unifiedQuote({
      input: {
        checkIn: "2026-03-02",
        checkOut: "2026-03-04",
        huespedes: 2,
        lofts: 1,
      },
      categoryId: "cielo",
      publicMode: true,
    });
    expect(vista.ok && cielo.ok).toBe(true);
    if (vista.ok && cielo.ok) {
      expect(cielo.totalReserva).toBeGreaterThan(vista.totalReserva);
      expect(CATEGORY_RATE_MULTIPLIER.cielo).toBe(1.2);
    }
  });
});
