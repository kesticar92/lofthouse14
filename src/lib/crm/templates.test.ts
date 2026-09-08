import { describe, expect, it } from "vitest";
import { renderTemplate, stubAutomationEvent } from "./templates";

describe("renderTemplate", () => {
  it("interpola variables", () => {
    expect(
      renderTemplate("Hola {{guest_name}} — {{reservation_code}}", {
        guest_name: "Ana",
        reservation_code: "LH-ABC123",
      }),
    ).toBe("Hola Ana — LH-ABC123");
  });
});

describe("stubAutomationEvent", () => {
  it("marca stub", () => {
    const e = stubAutomationEvent("booking_created", { id: "1" });
    expect(e.status).toBe("stub");
    expect(e.message).toContain("TODO: REAL INTEGRATION REQUIRED");
  });
});
