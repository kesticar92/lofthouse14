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

describe("extras catalog", () => {
  it("seed incluye early/late/breakfast/transfer", () => {
    const ids = seedBookingExtrasCatalog().map((e) => e.id);
    for (const id of BOOKING_EXTRAS_FOCUS_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("cotiza early check-in flat", () => {
    const q = quoteBookingExtras({
      selectedIds: ["early-checkin", "late-checkout"],
      guests: 2,
      nights: 3,
    });
    expect(q.totalCop).toBe(120_000);
    expect(q.lines).toHaveLength(2);
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

  it("reprices amountCop del cliente", () => {
    const q = normalizeClientExtras(
      [{ id: "early-checkin", label: "Hack", amountCop: 1 }],
      { guests: 2, nights: 2 },
    );
    expect(q.lines[0]?.amountCop).toBe(60_000);
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
