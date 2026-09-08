import { describe, expect, it, beforeEach } from "vitest";
import {
  addFolioCharge,
  computeFolioBalance,
  ensureFolioForReservation,
  getFolio,
  registerFolioPayment,
  resetFolios,
  settleFolioBalance,
} from "./store";
import { createLocalBooking } from "@/lib/booking/create-reservation";
import { resetLocalBookingStore } from "@/lib/availability/local-store";
import {
  getLocalPaymentByCode,
  resetLocalPayments,
} from "@/lib/payments/local-store";

beforeEach(() => {
  resetLocalBookingStore();
  resetLocalPayments();
  resetFolios();
});

describe("guest folio", () => {
  it("arma noches, extras, pagos y saldo", () => {
    const booking = createLocalBooking({
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Folio Guest",
      categoryId: "vista",
      price: 320_000,
      extras: [{ id: "breakfast", label: "Desayuno", amountCop: 50_000 }],
    });
    expect(booking.ok).toBe(true);
    if (!booking.ok) return;

    const folio = ensureFolioForReservation(booking.reservation);
    expect(folio.nights).toBe(3);
    expect(folio.charges.some((c) => c.kind === "room")).toBe(true);
    expect(folio.charges.some((c) => c.label === "Desayuno")).toBe(true);

    const bal0 = computeFolioBalance(folio);
    expect(bal0.charges_total).toBe(320_000);
    expect(bal0.balance).toBe(320_000);

    const afterPay = registerFolioPayment(folio.reservation_code, {
      amount: 100_000,
      method: "cash",
      notes: "Abono efectivo",
    });
    expect(afterPay).not.toBeNull();
    expect(computeFolioBalance(afterPay!).balance).toBe(220_000);

    addFolioCharge(folio.reservation_code, {
      label: "Minibar",
      amount: 30_000,
      kind: "addon",
    });
    const withCharge = getFolio(folio.reservation_code);
    expect(withCharge).not.toBeNull();
    expect(computeFolioBalance(withCharge!).balance).toBe(250_000);

    settleFolioBalance(folio.reservation_code);
    const settled = getFolio(folio.reservation_code)!;
    expect(computeFolioBalance(settled).balance).toBe(0);
    expect(getLocalPaymentByCode(folio.reservation_code)?.status).toBe("paid");
  });
});
