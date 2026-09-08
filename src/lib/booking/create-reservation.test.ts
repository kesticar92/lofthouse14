import { describe, expect, it, beforeEach } from "vitest";
import { createLocalBooking, lookupLocalBooking } from "./create-reservation";
import { resetLocalBookingStore } from "@/lib/availability/local-store";
import { generateReservationCode, isValidReservationCode } from "./reservation-code";
import {
  getLocalPaymentByCode,
  resetLocalPayments,
} from "@/lib/payments/local-store";

beforeEach(() => {
  resetLocalBookingStore();
  resetLocalPayments();
});

describe("reservation-code", () => {
  it("genera formato LH-XXXXXX", () => {
    const code = generateReservationCode("LH");
    expect(isValidReservationCode(code)).toBe(true);
  });
});

describe("createLocalBooking", () => {
  it("crea reserva con código y evita double booking", () => {
    const a = createLocalBooking({
      checkIn: "2026-11-01",
      checkOut: "2026-11-04",
      guests: 2,
      guestName: "Ana",
      categoryId: "vista",
      price: 270000,
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.reservation.reservation_code).toMatch(/^LH-/);
    expect(lookupLocalBooking(a.reservation.reservation_code)?.guest_name).toBe(
      "Ana",
    );

    // Misma unidad tipo vista: si solo quedan 1 de 2 libres, aún puede crear
    // Si agotamos todas las vista:
    const b = createLocalBooking({
      checkIn: "2026-11-01",
      checkOut: "2026-11-04",
      guests: 2,
      guestName: "Bob",
      categoryId: "vista",
    });
    expect(b.ok).toBe(true);

    // Contar cuántas vista activas hay en seed (~5) — llenamos
    let failures = 0;
    for (let i = 0; i < 20; i++) {
      const r = createLocalBooking({
        checkIn: "2026-11-01",
        checkOut: "2026-11-04",
        guests: 2,
        guestName: `Guest ${i}`,
        categoryId: "vista",
      });
      if (!r.ok) {
        failures++;
        expect(r.code).toBe("NO_AVAILABILITY");
        break;
      }
    }
    expect(failures).toBeGreaterThan(0);
  });

  it("rechaza fechas inválidas", () => {
    const r = createLocalBooking({
      checkIn: "2026-11-05",
      checkOut: "2026-11-05",
      guests: 1,
      guestName: "X",
    });
    expect(r.ok).toBe(false);
  });

  it("reserva pending vs confirmed", () => {
    const pending = createLocalBooking({
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
      guestName: "Pendiente",
      categoryId: "cielo",
      pending: true,
    });
    expect(pending.ok).toBe(true);
    if (pending.ok) {
      expect(pending.reservation.status).toBe("pending");
      expect(pending.reservation.payment_status).toBe("unpaid");
    }
  });

  it("crea payment pending cuando hay precio", () => {
    const r = createLocalBooking({
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      guestName: "Con pago",
      categoryId: "atrio",
      price: 180_000,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reservation.payment_status).toBe("pending");
    expect(r.payment?.amount).toBe(180_000);
    expect(getLocalPaymentByCode(r.reservation.reservation_code)?.status).toBe(
      "pending",
    );
    expect(lookupLocalBooking(r.reservation.reservation_code)?.payment_status).toBe(
      "pending",
    );
  });
});
