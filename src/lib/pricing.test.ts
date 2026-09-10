import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING, formatCOP, quote } from "./pricing";

describe("formatCOP", () => {
  it("formatea en pesos colombianos sin decimales", () => {
    expect(formatCOP(80000)).toMatch(/80/);
    expect(formatCOP(80000)).toMatch(/000/);
  });
});

describe("quote", () => {
  it("rechaza estancia de cero noches", () => {
    const r = quote({
      checkIn: "2026-01-10",
      checkOut: "2026-01-10",
      huespedes: 2,
      lofts: 1,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("calcula dos noches L–J con 2 huéspedes y 1 loft", () => {
    const r = quote(
      {
        checkIn: "2026-01-05",
        checkOut: "2026-01-07",
        huespedes: 2,
        lofts: 1,
      },
      DEFAULT_PRICING,
    );
    expect(r.ok).toBe(true);
    expect(r.noches).toBe(2);
    expect(r.nochesLJ).toBe(2);
    expect(r.nochesVD).toBe(0);
    expect(r.subtotalAlojamiento).toBe(2 * 90_000);
  });

  it("aplica tramos larga estadía 7 / 14 / 30", () => {
    const base = {
      checkIn: "2026-03-02",
      huespedes: 2,
      lofts: 1,
    };
    const d7 = quote(
      { ...base, checkOut: "2026-03-09" },
      DEFAULT_PRICING,
    );
    expect(d7.ok).toBe(true);
    if (d7.ok) {
      expect(d7.noches).toBe(7);
      expect(d7.descuentoDetalle).toMatch(/7\+/);
      expect(d7.descuento).toBeCloseTo(
        -(d7.subtotalAlojamiento + d7.recargoHuespedes) * 0.15,
      );
      expect(d7.aseoTotal).toBe(60_000);
    }

    const d14 = quote(
      { ...base, checkOut: "2026-03-16" },
      DEFAULT_PRICING,
    );
    expect(d14.ok).toBe(true);
    if (d14.ok) {
      expect(d14.noches).toBe(14);
      expect(d14.descuentoDetalle).toMatch(/14\+/);
      expect(d14.descuento).toBeCloseTo(
        -(d14.subtotalAlojamiento + d14.recargoHuespedes) * 0.25,
      );
      // ≥4 + >7: 60k + 2×30k
      expect(d14.aseoTotal).toBe(60_000 + 2 * 30_000);
    }

    const d30 = quote(
      { ...base, checkOut: "2026-04-01" },
      DEFAULT_PRICING,
    );
    expect(d30.ok).toBe(true);
    if (d30.ok) {
      expect(d30.noches).toBe(30);
      expect(d30.descuentoDetalle).toMatch(/30\+/);
      expect(d30.descuento).toBeCloseTo(
        -(d30.subtotalAlojamiento + d30.recargoHuespedes) * 0.4,
      );
      expect(d30.aseoTotal).toBe(60_000 + 4 * 30_000);
    }
  });

  it("aseo: 1–2 corto, ≥4 estándar, >7 con semanal extra", () => {
    const corta = quote(
      {
        checkIn: "2026-01-05",
        checkOut: "2026-01-07",
        huespedes: 2,
        lofts: 1,
      },
      DEFAULT_PRICING,
    );
    expect(corta.ok && corta.aseoTotal).toBe(30_000);

    const estandar = quote(
      {
        checkIn: "2026-01-05",
        checkOut: "2026-01-10",
        huespedes: 2,
        lofts: 1,
      },
      DEFAULT_PRICING,
    );
    expect(estandar.ok && estandar.noches).toBe(5);
    expect(estandar.ok && estandar.aseoTotal).toBe(60_000);
  });
});
