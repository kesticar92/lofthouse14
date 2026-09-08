import { describe, expect, it } from "vitest";
import {
  convertFromCop,
  formatMoney,
  getStubFxRates,
  FX_STUB_DISCLAIMER,
} from "./rates";

describe("fx stub", () => {
  it("marca stub y disclaimer", () => {
    const s = getStubFxRates();
    expect(s.isStub).toBe(true);
    expect(s.provider).toBe("stub_ecb_like");
    expect(s.disclaimer).toContain("NO son tasas oficiales");
    expect(FX_STUB_DISCLAIMER).toContain("TODO: REAL INTEGRATION");
  });

  it("convierte COP→USD/EUR sin inventar como oficial", () => {
    const usd = convertFromCop(410_000, "USD");
    expect(usd.stub).toBe(true);
    expect(usd.amount).toBe(100);
    const eur = convertFromCop(445_000, "EUR");
    expect(eur.amount).toBe(100);
  });

  it("formatea display", () => {
    expect(formatMoney(90_000, "COP")).toMatch(/90/);
    expect(formatMoney(410_000, "USD")).toMatch(/100/);
  });
});
