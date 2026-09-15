import { describe, expect, it } from "vitest";
import {
  BOOKING_EXTRAS_FOCUS_IDS,
  normalizeClientExtras,
  quoteBookingExtras,
  seedBookingExtrasCatalog,
} from "./extras-catalog";
import {
  normalizeBookingChannel,
  formatChannelNote,
} from "./channels";
import {
  AIRPORT_VEHICLE_CAPACITY,
  minAirportVehicles,
} from "@/lib/configurator-extras";

describe("extras catalog", () => {
  it("seed incluye early/late/breakfast/transfer", () => {
    const ids = seedBookingExtrasCatalog().map((e) => e.id);
    for (const id of BOOKING_EXTRAS_FOCUS_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("cotiza early/late flat por loft (1 loft por defecto)", () => {
    const q = quoteBookingExtras({
      selectedIds: ["early-checkin", "late-checkout"],
      guests: 2,
      nights: 3,
      lofts: 1,
    });
    expect(q.totalCop).toBe(120_000);
    expect(q.lines).toHaveLength(2);
  });

  it("multiplica early/late por el total de lofts si no se indica units", () => {
    const q = quoteBookingExtras({
      selectedIds: ["early-checkin"],
      guests: 4,
      nights: 2,
      lofts: 3,
    });
    expect(q.totalCop).toBe(60_000 * 3);
    expect(q.lines[0]?.meta).toMatchObject({ units: 3 });
  });

  it("permite early/late solo para algunos lofts", () => {
    const q = quoteBookingExtras({
      selectedIds: ["early-checkin", "late-checkout"],
      guests: 6,
      nights: 2,
      lofts: 3,
      timingQuantities: {
        "early-checkin": { units: 2 },
        "late-checkout": { units: 1 },
      },
    });
    expect(q.totalCop).toBe(60_000 * 2 + 60_000 * 1);
  });

  it("cotiza desayuno por huésped/día", () => {
    const q = quoteBookingExtras({
      selectedIds: ["breakfast"],
      guests: 2,
      nights: 3,
      mealQuantities: { breakfast: { days: 2, guests: 2 } },
    });
    expect(q.totalCop).toBe(15_000 * 2 * 2);
  });

  it("traslado: $70.000 × trayectos × vehículos", () => {
    const q = quoteBookingExtras({
      selectedIds: ["airport-transfer"],
      guests: 5,
      nights: 2,
      airportTransfer: { pickup: true, dropoff: true, vehicles: 2 },
    });
    expect(minAirportVehicles(5)).toBe(2);
    expect(q.totalCop).toBe(70_000 * 2 * 2);
    expect(q.lines[0]?.meta).toMatchObject({ legs: 2, vehicles: 2 });
  });

  it("traslado con 5+ huéspedes fuerza mínimo de vehículos", () => {
    const q = normalizeClientExtras(
      [
        {
          id: "airport-transfer",
          pickup: true,
          dropoff: false,
          vehicles: 1,
        },
      ],
      { guests: 5, nights: 2, lofts: 2 },
    );
    expect(q.lines[0]?.amountCop).toBe(70_000 * 1 * 2);
    expect(q.lines[0]?.meta).toMatchObject({ vehicles: 2 });
    expect(AIRPORT_VEHICLE_CAPACITY).toBe(4);
  });

  it("cotiza mascota a $30.000 por mascota (no por loft)", () => {
    const q = quoteBookingExtras({
      selectedIds: ["pet"],
      guests: 4,
      nights: 2,
      lofts: 2,
      timingQuantities: { pet: { units: 3 } },
    });
    expect(q.totalCop).toBe(30_000 * 3);
    expect(q.lines[0]?.meta).toMatchObject({ pets: 3 });
  });

  it("limita mascotas a 2 por loft", () => {
    const q = normalizeClientExtras(
      [{ id: "pet", units: 99 }],
      { guests: 2, nights: 2, lofts: 2 },
    );
    expect(q.lines[0]?.amountCop).toBe(30_000 * 4);
  });

  it("limita días de desayuno al número de noches", () => {
    const q = quoteBookingExtras({
      selectedIds: ["breakfast"],
      guests: 2,
      nights: 3,
      mealQuantities: { breakfast: { days: 10, guests: 2 } },
    });
    expect(q.totalCop).toBe(15_000 * 3 * 2);
    expect(q.lines[0]?.meta).toMatchObject({ days: 3 });
  });

  it("reprices amountCop del cliente y aplica units de lofts", () => {
    const q = normalizeClientExtras(
      [{ id: "early-checkin", label: "Hack", amountCop: 1, units: 2 }],
      { guests: 2, nights: 2, lofts: 3 },
    );
    expect(q.lines[0]?.amountCop).toBe(120_000);
  });
});

describe("booking channels", () => {
  it("normaliza corporate / referral", () => {
    expect(normalizeBookingChannel("corp")).toBe("corporate");
    expect(normalizeBookingChannel("referido")).toBe("referral");
    expect(normalizeBookingChannel("direct")).toBe("direct");
  });

  it("formatea nota canal", () => {
    expect(
      formatChannelNote({
        channel: "corporate",
        corporate_name: "Acme SAS",
      }),
    ).toContain("Acme");
  });
});
