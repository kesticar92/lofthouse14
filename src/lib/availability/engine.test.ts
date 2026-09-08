import { describe, expect, it } from "vitest";
import {
  availabilityByRoomType,
  findAvailableUnits,
  isUnitBookable,
  nightAvailabilityCalendar,
  wouldDoubleBook,
  type InventoryUnit,
  type OccupancyInterval,
} from "./engine";

const units: InventoryUnit[] = [
  {
    propertyId: "p1",
    roomId: "r1",
    roomTypeId: "vista",
    status: "active",
    maxGuests: 5,
  },
  {
    propertyId: "p2",
    roomId: "r2",
    roomTypeId: "vista",
    status: "active",
    maxGuests: 5,
  },
  {
    propertyId: "p3",
    roomId: "r3",
    roomTypeId: "atrio",
    status: "out_of_service",
    maxGuests: 5,
  },
];

describe("isUnitBookable", () => {
  it("solo active es bookable", () => {
    expect(isUnitBookable(units[0]!)).toBe(true);
    expect(isUnitBookable(units[2]!)).toBe(false);
  });
});

describe("findAvailableUnits", () => {
  it("excluye unidades ocupadas y out_of_service", () => {
    const intervals: OccupancyInterval[] = [
      {
        propertyId: "p1",
        start: "2026-09-10",
        endExclusive: "2026-09-12",
        kind: "reservation",
        status: "confirmed",
      },
    ];
    const avail = findAvailableUnits({
      units,
      intervals,
      checkIn: "2026-09-10",
      checkOut: "2026-09-11",
      roomTypeId: "vista",
    });
    expect(avail.map((u) => u.propertyId)).toEqual(["p2"]);
  });

  it("permite checkout = checkin de otra reserva (fin exclusivo)", () => {
    const intervals: OccupancyInterval[] = [
      {
        propertyId: "p1",
        start: "2026-09-10",
        endExclusive: "2026-09-12",
        kind: "reservation",
        status: "confirmed",
      },
    ];
    const avail = findAvailableUnits({
      units: [units[0]!],
      intervals,
      checkIn: "2026-09-12",
      checkOut: "2026-09-14",
    });
    expect(avail).toHaveLength(1);
  });

  it("holds activos bloquean", () => {
    const intervals: OccupancyInterval[] = [
      {
        propertyId: "p2",
        start: "2026-09-10",
        endExclusive: "2026-09-13",
        kind: "hold",
        status: "active",
      },
    ];
    const avail = findAvailableUnits({
      units: [units[1]!],
      intervals,
      checkIn: "2026-09-11",
      checkOut: "2026-09-12",
    });
    expect(avail).toHaveLength(0);
  });

  it("cancelled no bloquea", () => {
    const intervals: OccupancyInterval[] = [
      {
        propertyId: "p1",
        start: "2026-09-10",
        endExclusive: "2026-09-13",
        kind: "reservation",
        status: "cancelled",
      },
    ];
    expect(
      findAvailableUnits({
        units: [units[0]!],
        intervals,
        checkIn: "2026-09-10",
        checkOut: "2026-09-12",
      }),
    ).toHaveLength(1);
  });

  it("checked_in y confirmed siguen ocupando", () => {
    for (const status of ["confirmed", "checked_in", "pending"] as const) {
      const intervals: OccupancyInterval[] = [
        {
          propertyId: "p1",
          start: "2026-09-10",
          endExclusive: "2026-09-13",
          kind: "reservation",
          status,
        },
      ];
      expect(
        findAvailableUnits({
          units: [units[0]!],
          intervals,
          checkIn: "2026-09-11",
          checkOut: "2026-09-12",
        }),
      ).toHaveLength(0);
    }
  });
});

describe("wouldDoubleBook", () => {
  it("detecta conflicto", () => {
    const intervals: OccupancyInterval[] = [
      {
        propertyId: "p1",
        start: "2026-09-10",
        endExclusive: "2026-09-15",
        kind: "block",
        status: "active",
      },
    ];
    expect(wouldDoubleBook("p1", "2026-09-12", "2026-09-14", intervals)).toBe(
      true,
    );
    expect(wouldDoubleBook("p2", "2026-09-12", "2026-09-14", intervals)).toBe(
      false,
    );
  });
});

describe("availabilityByRoomType", () => {
  it("agrega por tipo", () => {
    const rows = availabilityByRoomType({
      units,
      intervals: [],
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
    });
    const vista = rows.find((r) => r.roomTypeId === "vista");
    const atrio = rows.find((r) => r.roomTypeId === "atrio");
    expect(vista?.availableCount).toBe(2);
    expect(atrio?.availableCount).toBe(0);
    expect(atrio?.totalActive).toBe(0);
  });
});

describe("nightAvailabilityCalendar", () => {
  it("marca noches ocupadas vs libres", () => {
    const intervals: OccupancyInterval[] = [
      {
        propertyId: "p1",
        start: "2026-09-10",
        endExclusive: "2026-09-12",
        kind: "reservation",
        status: "confirmed",
      },
      {
        propertyId: "p2",
        start: "2026-09-10",
        endExclusive: "2026-09-12",
        kind: "reservation",
        status: "confirmed",
      },
    ];
    const nights = nightAvailabilityCalendar({
      units: units.filter((u) => u.roomTypeId === "vista"),
      intervals,
      from: "2026-09-10",
      toExclusive: "2026-09-13",
      roomTypeId: "vista",
    });
    expect(nights).toHaveLength(3);
    expect(nights[0]?.available).toBe(false);
    expect(nights[1]?.available).toBe(false);
    expect(nights[2]?.available).toBe(true);
  });
});
