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
    expect(r.subtotalAlojamiento).toBe(2 * 80_000);
  });
});
