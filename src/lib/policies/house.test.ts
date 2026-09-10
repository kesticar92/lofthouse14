import { describe, expect, it } from "vitest";
import {
  ASEO_CORTA_COP,
  ASEO_ESTANDAR_COP,
  ASEO_SEMANAL_EXTRA_COP,
  DAMAGE_DEPOSIT_LONG_COP,
  DAMAGE_DEPOSIT_SHORT_COP,
  MAX_STAY_NIGHTS,
  aseoSemanasExtra,
  computeAseo,
  damageDepositPerLoftCop,
  damageDepositTotalCop,
} from "./house";

describe("damageDeposit", () => {
  it("cobra $200.000 por loft si la reserva es de menos de 7 días", () => {
    expect(damageDepositPerLoftCop(1)).toBe(DAMAGE_DEPOSIT_SHORT_COP);
    expect(damageDepositPerLoftCop(6)).toBe(DAMAGE_DEPOSIT_SHORT_COP);
    expect(damageDepositTotalCop(3, 2)).toBe(DAMAGE_DEPOSIT_SHORT_COP * 2);
  });

  it("cobra $500.000 por loft si la reserva es ≥ 7 días", () => {
    expect(damageDepositPerLoftCop(7)).toBe(DAMAGE_DEPOSIT_LONG_COP);
    expect(damageDepositPerLoftCop(14)).toBe(DAMAGE_DEPOSIT_LONG_COP);
    expect(damageDepositTotalCop(10, 3)).toBe(DAMAGE_DEPOSIT_LONG_COP * 3);
  });
});

describe("computeAseo", () => {
  it("1–2 noches: $30.000 por loft", () => {
    const r = computeAseo({ noches: 2, lofts: 1 });
    expect(r.total).toBe(ASEO_CORTA_COP);
    expect(r.semanasExtra).toBe(0);
  });

  it("3 noches: aseo corto (fuera de ≥4)", () => {
    const r = computeAseo({ noches: 3, lofts: 1 });
    expect(r.total).toBe(ASEO_CORTA_COP);
  });

  it("a partir de 4 noches: $60.000 por loft", () => {
    const r4 = computeAseo({ noches: 4, lofts: 1 });
    const r7 = computeAseo({ noches: 7, lofts: 2 });
    expect(r4.total).toBe(ASEO_ESTANDAR_COP);
    expect(r7.total).toBe(ASEO_ESTANDAR_COP * 2);
    expect(r7.semanasExtra).toBe(0);
  });

  it(">7 días: $60.000 + $30.000 × floor(noches/7) por loft", () => {
    expect(aseoSemanasExtra(8)).toBe(1);
    expect(aseoSemanasExtra(14)).toBe(2);
    const r8 = computeAseo({ noches: 8, lofts: 1 });
    expect(r8.total).toBe(ASEO_ESTANDAR_COP + ASEO_SEMANAL_EXTRA_COP);
    const r14 = computeAseo({ noches: 14, lofts: 2 });
    expect(r14.total).toBe(
      (ASEO_ESTANDAR_COP + 2 * ASEO_SEMANAL_EXTRA_COP) * 2,
    );
  });
});

describe("MAX_STAY_NIGHTS", () => {
  it("máximo estándar de 30 días", () => {
    expect(MAX_STAY_NIGHTS).toBe(30);
  });
});
