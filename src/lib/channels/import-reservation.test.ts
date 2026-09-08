import { describe, expect, it, beforeEach } from "vitest";
import { importChannelReservation } from "./import-reservation";
import { resetLocalBookingStore } from "@/lib/availability/local-store";
import { resetLocalPayments } from "@/lib/payments/local-store";
import { lookupLocalBooking } from "@/lib/booking/create-reservation";

beforeEach(() => {
  resetLocalBookingStore();
  resetLocalPayments();
});

describe("importChannelReservation", () => {
  it("crea reserva local + payment pending desde canal stub", () => {
    const r = importChannelReservation({
      channel: "airbnb",
      guestName: "OTA Ana",
      checkIn: "2026-11-10",
      checkOut: "2026-11-13",
      guests: 2,
      categoryId: "cielo",
      price: 200_000,
      externalId: "sim-1",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reservation.reservation_code).toMatch(/^LH-/);
    expect(r.reservation.channel).toBe("airbnb");
    expect(r.payment.status).toBe("pending");
    expect(lookupLocalBooking(r.reservation.reservation_code)?.guest_name).toBe(
      "OTA Ana",
    );
  });
});
