import { describe, expect, it } from "vitest";

import { DEFAULT_PRICING } from "@/lib/pricing";
import { parseCotizacionesPricing } from "@/lib/cotizaciones-pricing";

describe("parseCotizacionesPricing", () => {
  it("devuelve defaults si el valor es inválido", () => {
    expect(parseCotizacionesPricing(null)).toEqual(DEFAULT_PRICING);
    expect(parseCotizacionesPricing("x")).toEqual(DEFAULT_PRICING);
  });

  it("fusiona campos válidos", () => {
    const parsed = parseCotizacionesPricing({
      tarifaLJ: 90_000,
      descuentoSemanal: 0.15,
    });
    expect(parsed.tarifaLJ).toBe(90_000);
    expect(parsed.descuentoSemanal).toBe(0.15);
    expect(parsed.tarifaVD).toBe(DEFAULT_PRICING.tarifaVD);
  });
});
