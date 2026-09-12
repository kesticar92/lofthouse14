import { describe, expect, it } from "vitest";
import {
  STEP_EXTRAS,
  STEP_FECHAS,
  STEP_HUESPEDES,
  STEP_LOFT,
  nextLogicalStep,
  prevLogicalStep,
  resolveEntryStep,
  stepAfterSelectingLoft,
  STEP_CONFIRMAR,
  STEP_TU_VIAJE,
} from "@/lib/wizard-flow";

describe("resolveEntryStep", () => {
  it("banner con fechas+huéspedes → Loft (no Fechas)", () => {
    expect(
      resolveEntryStep({
        checkIn: "2026-10-01",
        checkOut: "2026-10-03",
        guests: 2,
        from: "banner",
        step: 3,
      }),
    ).toBe(STEP_LOFT);
  });

  it("banner con estadía + loft ya elegido → Extras (no repetir fechas)", () => {
    expect(
      resolveEntryStep({
        checkIn: "2026-10-01",
        checkOut: "2026-10-03",
        guests: 2,
        categoryId: "vista",
        from: "banner",
      }),
    ).toBe(STEP_EXTRAS);
  });

  it("card sin fechas → Fechas (loft ya viene de la card)", () => {
    expect(
      resolveEntryStep({
        categoryId: "cielo",
        from: "card",
        step: 1,
      }),
    ).toBe(STEP_FECHAS);
  });

  it("card con fechas+huéspedes → Extras (sin 2ª pasada)", () => {
    expect(
      resolveEntryStep({
        checkIn: "2026-10-01",
        checkOut: "2026-10-03",
        guests: 2,
        categoryId: "atrio",
        from: "card",
      }),
    ).toBe(STEP_EXTRAS);
  });
});

describe("nextLogicalStep / stepAfterSelectingLoft", () => {
  it("banner→loft→extras: tras loft no vuelve a fechas/huéspedes", () => {
    const flags = {
      skipTripStep: true,
      skipStaySteps: true,
      skipLoftStep: false,
      hasDates: true,
      hasGuests: true,
      hasCategory: true,
    };
    expect(nextLogicalStep(STEP_LOFT, flags)).toBe(STEP_EXTRAS);
    expect(stepAfterSelectingLoft({ hasDates: true, hasGuests: true })).toBe(
      STEP_EXTRAS,
    );
  });

  it("card→fechas→extras: con huéspedes en draft salta loft y no repite fechas", () => {
    const afterFechas = nextLogicalStep(STEP_FECHAS, {
      skipTripStep: true,
      skipStaySteps: false,
      skipLoftStep: true,
      hasDates: true,
      hasGuests: true,
      hasCategory: true,
    });
    expect(afterFechas).toBe(STEP_EXTRAS);

    const afterHuespedes = nextLogicalStep(STEP_HUESPEDES, {
      skipTripStep: true,
      skipStaySteps: false,
      skipLoftStep: true,
      hasDates: true,
      hasGuests: true,
      hasCategory: true,
    });
    expect(afterHuespedes).toBe(STEP_EXTRAS);
  });

  it("elegir loft después de fechas/huéspedes → Extras", () => {
    expect(
      stepAfterSelectingLoft({ hasDates: true, hasGuests: true }),
    ).toBe(STEP_EXTRAS);
    expect(
      nextLogicalStep(STEP_LOFT, {
        skipTripStep: false,
        skipStaySteps: false,
        skipLoftStep: false,
        hasDates: true,
        hasGuests: true,
        hasCategory: true,
      }),
    ).toBe(STEP_EXTRAS);
  });
});


describe("prevLogicalStep", () => {
  const skipped = {
    skipStaySteps: true,
    skipTripStep: true,
    skipLoftStep: true,
    hasDates: true,
    hasGuests: true,
    hasCategory: true,
  };

  it("siempre permite volver al paso canónico anterior aunque haya skips", () => {
    expect(prevLogicalStep(STEP_CONFIRMAR, skipped)).toBe(STEP_EXTRAS);
    expect(prevLogicalStep(STEP_EXTRAS, skipped)).toBe(STEP_LOFT);
    expect(prevLogicalStep(STEP_LOFT, skipped)).toBe(STEP_HUESPEDES);
    expect(prevLogicalStep(STEP_HUESPEDES, skipped)).toBe(STEP_FECHAS);
    expect(prevLogicalStep(STEP_FECHAS, skipped)).toBe(STEP_TU_VIAJE);
    expect(prevLogicalStep(STEP_TU_VIAJE, skipped)).toBeNull();
  });
});
