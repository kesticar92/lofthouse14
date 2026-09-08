import { describe, expect, it, beforeEach } from "vitest";
import {
  listChannelSyncLogs,
  resetChannelSyncLogs,
  runChannelSyncJob,
  syncAvailability,
  syncRates,
} from "./sync-runner";

beforeEach(() => {
  resetChannelSyncLogs();
});

describe("channel sync runner", () => {
  it("syncAvailability OTA queda simulated (no éxito real)", async () => {
    const entry = await syncAvailability({
      channel: "booking",
      checkIn: "2026-10-01",
      checkOut: "2026-10-05",
      available: 1,
    });
    expect(entry.is_stub).toBe(true);
    expect(entry.status).toBe("simulated");
    expect(entry.message).toMatch(/TODO: REAL INTEGRATION REQUIRED|stub/i);
    expect(listChannelSyncLogs()).toHaveLength(1);
  });

  it("syncRates no inventa API oficial como éxito", async () => {
    const entry = await syncRates({
      channel: "airbnb",
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
      amountCop: 200000,
    });
    expect(entry.payload?.officialApi).toBe(false);
    expect(entry.message).toMatch(/TODO: REAL INTEGRATION REQUIRED/);
  });

  it("iCal availability no es stub OTA", async () => {
    const entry = await runChannelSyncJob({
      channel: "ical",
      jobType: "availability",
      checkIn: "2026-10-01",
      checkOut: "2026-10-07",
    });
    expect(entry.is_stub).toBe(false);
    expect(entry.status).toBe("accepted");
  });
});
