import { describe, expect, it } from "vitest";
import {
  alternativeCategories,
  candidateLoftsForCategory,
  pickUnitsForGuests,
  poolCapacity,
} from "@/lib/availability/loft-priority";
import {
  availableLoftsForGuests,
  getLoftCategory,
} from "@/data/loft-categories";

describe("candidateLoftsForCategory — Atrio", () => {
  it("con ≤3 huéspedes incluye 7, 8 y 5 (prioridad 7/8)", () => {
    const nums = candidateLoftsForCategory("atrio", 2).map((c) => c.unitNumber);
    expect(nums).toEqual([7, 8, 5]);
  });

  it("con 4–10 huéspedes solo 7 y 8 (sin loft 5)", () => {
    expect(
      candidateLoftsForCategory("atrio", 4).map((c) => c.unitNumber),
    ).toEqual([7, 8]);
    expect(
      candidateLoftsForCategory("atrio", 10).map((c) => c.unitNumber),
    ).toEqual([7, 8]);
  });

  it("con 11–13 incluye 7, 8 y 5", () => {
    expect(
      candidateLoftsForCategory("atrio", 11).map((c) => c.unitNumber),
    ).toEqual([7, 8, 5]);
    expect(
      candidateLoftsForCategory("atrio", 13).map((c) => c.unitNumber),
    ).toEqual([7, 8, 5]);
  });

  it("con más de 13 no ofrece Atrio", () => {
    expect(candidateLoftsForCategory("atrio", 14)).toEqual([]);
  });

  it("loft 5 tiene max_guests 3", () => {
    const five = candidateLoftsForCategory("atrio", 2).find(
      (c) => c.unitNumber === 5,
    );
    expect(five?.maxGuests).toBe(3);
  });
});

describe("pickUnitsForGuests", () => {
  it("prefiere una sola unidad que quepa (7 antes que 5)", () => {
    const pool = candidateLoftsForCategory("atrio", 2);
    const picked = pickUnitsForGuests(pool, 2);
    expect(picked?.map((p) => p.unitNumber)).toEqual([7]);
  });

  it("para 6 huéspedes en Atrio usa 7+8", () => {
    const pool = candidateLoftsForCategory("atrio", 6);
    const picked = pickUnitsForGuests(pool, 6);
    expect(picked?.map((p) => p.unitNumber)).toEqual([7, 8]);
  });

  it("para 11 huéspedes en Atrio usa 7+8+5", () => {
    const pool = candidateLoftsForCategory("atrio", 11);
    expect(poolCapacity(pool)).toBe(13);
    const picked = pickUnitsForGuests(pool, 11);
    expect(picked?.map((p) => p.unitNumber)).toEqual([7, 8, 5]);
  });
});

describe("alternativeCategories", () => {
  it("ofrece más caro primero (Vista → Atrio → Cielo)", () => {
    expect(alternativeCategories("cielo")).toEqual(["vista", "atrio"]);
    expect(alternativeCategories("atrio")).toEqual(["vista", "cielo"]);
    expect(alternativeCategories("vista")).toEqual(["atrio", "cielo"]);
  });
});

describe("availableLoftsForGuests UI", () => {
  it("Atrio oculta loft 5 entre 4 y 10 huéspedes", () => {
    const atrio = getLoftCategory("atrio");
    expect(availableLoftsForGuests(atrio, 5)).toEqual([7, 8]);
    expect(availableLoftsForGuests(atrio, 12)).toEqual([7, 8, 5]);
    expect(availableLoftsForGuests(atrio, 14)).toEqual([]);
  });
});
