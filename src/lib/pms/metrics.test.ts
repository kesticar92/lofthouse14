import { describe, expect, it } from "vitest";
import { computePmsMetrics } from "./metrics";

describe("computePmsMetrics", () => {
  it("calcula ocupación ADR RevPAR básicos", () => {
    const m = computePmsMetrics({
      from: "2026-09-01",
      to: "2026-09-03",
      rooms: 2,
      asOf: "2026-09-01",
      reservations: [
        {
          property_id: "p1",
          check_in: "2026-09-01",
          check_out: "2026-09-03",
          status: "confirmed",
          price: 200_000,
        },
      ],
    });
    // 2 rooms * 2 nights = 4 available; 1 room * 2 nights sold
    expect(m.roomNightsAvailable).toBe(4);
    expect(m.roomNightsSold).toBe(2);
    expect(m.occupancyRate).toBe(0.5);
    expect(m.adr).toBe(100_000);
    expect(m.revpar).toBe(50_000);
    expect(m.arrivals).toBe(1);
    expect(m.inHouse).toBe(1);
  });
});
