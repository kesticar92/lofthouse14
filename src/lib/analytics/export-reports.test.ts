import { describe, expect, it } from "vitest";
import {
  channelRevenueBreakdown,
  occupancyRevenueCsv,
  toExcelCsv,
} from "./export-reports";
import type { PmsMetrics } from "@/lib/pms/metrics";

const metrics: PmsMetrics = {
  from: "2026-09-01",
  to: "2026-09-08",
  rooms: 14,
  roomNightsAvailable: 98,
  roomNightsSold: 20,
  occupancyRate: 0.2,
  roomRevenue: 2_000_000,
  adr: 100_000,
  revpar: 20_408,
  arrivals: 5,
  departures: 4,
  inHouse: 3,
};

describe("export reports", () => {
  it("CSV Excel-friendly con BOM y ;", () => {
    const csv = toExcelCsv(["a", "b"], [["x", 1]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("a;b");
    expect(csv).toContain("x;1");
  });

  it("breakdown canal + occupancy csv", () => {
    const channels = channelRevenueBreakdown(
      [
        {
          channel: "direct",
          check_in: "2026-09-02",
          check_out: "2026-09-04",
          status: "confirmed",
          price: 200_000,
        },
        {
          channel: "airbnb",
          check_in: "2026-09-03",
          check_out: "2026-09-05",
          status: "confirmed",
          price: 300_000,
        },
      ],
      "2026-09-01",
      "2026-09-08",
    );
    expect(channels).toHaveLength(2);
    const csv = occupancyRevenueCsv({ metrics, channels });
    expect(csv).toContain("occupancy_rate");
    expect(csv).toContain("airbnb");
  });
});
