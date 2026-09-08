import { describe, expect, it } from "vitest";
import {
  aiAssistantStub,
  buildRevenueRecommendations,
  metricsToCsv,
} from "./reports";
import type { PmsMetrics } from "@/lib/pms/metrics";

const base: PmsMetrics = {
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

describe("analytics stubs", () => {
  it("recomienda sin auto-apply", () => {
    const recs = buildRevenueRecommendations(base);
    expect(recs.some((r) => r.id === "occ-critical-low" || r.id === "occ-low")).toBe(
      true,
    );
    expect(recs.every((r) => r.autoApply === false)).toBe(true);
  });

  it("enriquece banda alta y mid", () => {
    const high = buildRevenueRecommendations({
      ...base,
      occupancyRate: 0.9,
      roomNightsSold: 88,
    });
    expect(high.some((r) => r.id === "occ-high")).toBe(true);
    expect(high.every((r) => r.autoApply === false)).toBe(true);

    const mid = buildRevenueRecommendations({
      ...base,
      occupancyRate: 0.55,
      roomNightsSold: 54,
      arrivals: 8,
    });
    expect(mid.some((r) => r.id === "mid-band-lengthen")).toBe(true);
  });

  it("exporta CSV", () => {
    const csv = metricsToCsv(base);
    expect(csv.split("\n")[0]).toContain("occupancy_rate");
    expect(csv).toContain("2026-09-01");
  });

  it("AI requiere key", () => {
    const r = aiAssistantStub("¿Cuál es mi RevPAR?");
    expect(r.requiresLlmKey).toBe(true);
  });
});
