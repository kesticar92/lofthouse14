import { describe, expect, it } from "vitest";
import {
  blockBarClasses,
  blockTypeLabel,
  isOutOfServiceUnit,
  reservationBarClasses,
  statusLabel,
} from "./colors";

describe("reservationBarClasses", () => {
  it("prioriza estado operativo sobre origen", () => {
    expect(reservationBarClasses("airbnb", "pending")).toContain("amber");
    expect(reservationBarClasses("airbnb", "checked_in")).toContain("teal");
    expect(reservationBarClasses("airbnb", "cancelled")).toContain("zinc");
  });

  it("usa color de origen cuando confirmed", () => {
    expect(reservationBarClasses("airbnb", "confirmed")).toContain("orange");
    expect(reservationBarClasses("direct", "confirmed")).toContain("emerald");
  });
});

describe("blockBarClasses / labels", () => {
  it("distingue out_of_service y maintenance", () => {
    expect(blockBarClasses("out_of_service")).toContain("red");
    expect(blockBarClasses("maintenance")).toContain("orange");
    expect(blockTypeLabel("out_of_service")).toMatch(/servicio/i);
  });
});

describe("status helpers", () => {
  it("labels y OOS", () => {
    expect(statusLabel("checked_in")).toBe("Check-in");
    expect(isOutOfServiceUnit("out_of_service")).toBe(true);
    expect(isOutOfServiceUnit("active")).toBe(false);
  });
});
