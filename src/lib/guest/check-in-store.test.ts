import { describe, expect, it, beforeEach } from "vitest";
import {
  saveDigitalCheckIn,
  getDigitalCheckIn,
  resetDigitalCheckIns,
} from "./check-in-store";
import {
  guestStatusLabel,
  guestPaymentLabel,
  nightsBetween,
} from "./status";

beforeEach(() => {
  resetDigitalCheckIns();
});

describe("guest status labels", () => {
  it("traduce estados de reserva y pago", () => {
    expect(guestStatusLabel("confirmed")).toMatch(/Confirmada/i);
    expect(guestPaymentLabel("pending")).toMatch(/proceso/i);
    expect(nightsBetween("2026-11-01", "2026-11-04")).toBe(3);
  });
});

describe("digital check-in store", () => {
  it("exige datos, términos y ETA", () => {
    const bad = saveDigitalCheckIn({
      reservation_code: "LH-TEST01",
      guest_name: "Ana",
      guests: 2,
      arrival_eta: "",
      terms_accepted: false,
      data_confirmed: false,
      completed_at: new Date().toISOString(),
    });
    expect(bad.ok).toBe(false);

    const ok = saveDigitalCheckIn({
      reservation_code: "LH-TEST01",
      guest_name: "Ana",
      guests: 2,
      arrival_eta: "16:30",
      terms_accepted: true,
      data_confirmed: true,
      completed_at: new Date().toISOString(),
    });
    expect(ok.ok).toBe(true);
    expect(getDigitalCheckIn("lh-test01")?.arrival_eta).toBe("16:30");
  });
});
