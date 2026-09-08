import { describe, expect, it, beforeEach } from "vitest";
import {
  listCoupons,
  resetCoupons,
  upsertCoupon,
  validateCoupon,
} from "./coupons";

beforeEach(() => {
  resetCoupons();
});

describe("coupons", () => {
  it("seed incluye BIENVENIDA10 y valida descuento", () => {
    const codes = listCoupons().map((c) => c.code);
    expect(codes).toContain("BIENVENIDA10");

    const ok = validateCoupon({
      code: "bienvenida10",
      subtotal: 500_000,
      nights: 3,
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.discount).toBe(50_000); // 10% capped? 50k < 80k max
    expect(ok.total_after).toBe(450_000);
  });

  it("respeta tope max_discount_cop", () => {
    const ok = validateCoupon({
      code: "BIENVENIDA10",
      subtotal: 2_000_000,
      nights: 5,
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.discount).toBe(80_000);
  });

  it("rechaza expirado y min nights", () => {
    const exp = validateCoupon({
      code: "EXPIRADO",
      subtotal: 100_000,
      nights: 2,
      asOf: "2026-09-01",
    });
    expect(exp.ok).toBe(false);
    if (exp.ok) return;
    expect(exp.code).toBe("EXPIRED");

    const min = validateCoupon({
      code: "MIDWEEK50",
      subtotal: 200_000,
      nights: 1,
    });
    expect(min.ok).toBe(false);
    if (min.ok) return;
    expect(min.code).toBe("MIN_NIGHTS");
  });

  it("CRUD local upsert", () => {
    const row = upsertCoupon({
      code: "TEST20",
      name: "Test 20%",
      description: "demo",
      discount_type: "percent",
      discount_value: 20,
      active: true,
    });
    expect(row.code).toBe("TEST20");
    const v = validateCoupon({ code: "TEST20", subtotal: 100_000, nights: 1 });
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.discount).toBe(20_000);
  });
});
