import { describe, expect, it, beforeEach } from "vitest";
import {
  listAutomationRuns,
  resetAutomationRuns,
  runAutomation,
} from "./automation-runner";

beforeEach(() => {
  resetAutomationRuns();
});

describe("automation runner", () => {
  it("loguea booking_created con template y notification", () => {
    const run = runAutomation({
      eventType: "booking_created",
      payload: {
        guest_name: "Ana",
        reservation_code: "LH-TEST01",
        check_in: "2026-10-01",
        check_out: "2026-10-03",
        total: "270000",
      },
    });
    expect(run.status).toBe("stub_sent");
    expect(run.template_code).toBe("booking_confirmation");
    expect(run.rendered_body).toContain("Ana");
    expect(run.rendered_body).toContain("LH-TEST01");
    expect(run.notification?.title).toContain("reserva");
    expect(listAutomationRuns()).toHaveLength(1);
  });

  it("loguea post_stay en checkout", () => {
    const run = runAutomation({
      eventType: "post_stay",
      payload: { reservation_code: "LH-OUT", guest_name: "Bob" },
    });
    expect(run.event_type).toBe("post_stay");
    expect(run.message).toContain("TODO: REAL INTEGRATION REQUIRED");
  });
});
