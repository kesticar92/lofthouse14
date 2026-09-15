import { describe, expect, it } from "vitest";
import {
  EARLY_CHECKIN_SAME_DAY_CUTOFF_HOUR,
  isEarlyCheckInOffered,
} from "@/lib/configurator-extras";

/** Construye un instante UTC que, en America/Bogota (UTC−5), es `ymd` a `hourLocal`:00. */
function bogotaLocalAsUtc(ymd: string, hourLocal: number, minute = 0): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hourLocal + 5, minute, 0));
}

describe("isEarlyCheckInOffered", () => {
  it("cutoff es 14:00 (2 p.m.)", () => {
    expect(EARLY_CHECKIN_SAME_DAY_CUTOFF_HOUR).toBe(14);
  });

  it("ofrece early en fechas futuras aunque sea de tarde", () => {
    const now = bogotaLocalAsUtc("2026-09-15", 18);
    expect(isEarlyCheckInOffered("2026-09-16", now)).toBe(true);
    expect(isEarlyCheckInOffered("2026-10-01", now)).toBe(true);
  });

  it("mismo día antes de las 2 p.m.: sí se ofrece", () => {
    const now = bogotaLocalAsUtc("2026-09-15", 13, 59);
    expect(isEarlyCheckInOffered("2026-09-15", now)).toBe(true);
  });

  it("mismo día a las 2 p.m. o después: no se ofrece", () => {
    expect(
      isEarlyCheckInOffered("2026-09-15", bogotaLocalAsUtc("2026-09-15", 14)),
    ).toBe(false);
    expect(
      isEarlyCheckInOffered("2026-09-15", bogotaLocalAsUtc("2026-09-15", 15)),
    ).toBe(false);
    expect(
      isEarlyCheckInOffered("2026-09-15", bogotaLocalAsUtc("2026-09-15", 22)),
    ).toBe(false);
  });

  it("fecha de ingreso pasada: no se ofrece", () => {
    const now = bogotaLocalAsUtc("2026-09-15", 10);
    expect(isEarlyCheckInOffered("2026-09-14", now)).toBe(false);
  });

  it("sin fecha aún: se mantiene visible", () => {
    expect(isEarlyCheckInOffered("")).toBe(true);
  });
});
