import { describe, expect, it, beforeEach } from "vitest";
import {
  createLocalMaintenanceTicket,
  resetLocalMaintenance,
} from "./maintenance";
import {
  addLocalBlock,
  listLocalOccupancy,
  resetLocalBookingStore,
  seedInventoryUnits,
} from "@/lib/availability/local-store";
import { findAvailableUnits } from "@/lib/availability/engine";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

beforeEach(() => {
  resetLocalMaintenance();
  resetLocalBookingStore();
});

describe("maintenance OUT_OF_SERVICE → availability", () => {
  it("bloquea unidad en el motor cuando hay block OOS", () => {
    const units = seedInventoryUnits();
    const unit = units[0]!;
    const ticket = createLocalMaintenanceTicket(LOFTHOUSE_ORGANIZATION_ID, {
      title: "Fuga",
      blocksAvailability: true,
      legacyPropertyId: unit.propertyId,
    });
    expect(ticket.blocks_availability).toBe(true);

    addLocalBlock({
      id: `block-${ticket.id}`,
      propertyId: unit.propertyId,
      start: "2026-11-01",
      endExclusive: "2026-11-15",
      kind: "out_of_service",
      status: "active",
    });

    const avail = findAvailableUnits({
      units,
      intervals: listLocalOccupancy(),
      checkIn: "2026-11-05",
      checkOut: "2026-11-08",
    });
    expect(avail.some((u) => u.propertyId === unit.propertyId)).toBe(false);
  });
});
