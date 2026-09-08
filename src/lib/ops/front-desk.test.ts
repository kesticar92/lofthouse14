import { describe, expect, it, beforeEach } from "vitest";
import { buildFrontDeskDay } from "./front-desk";
import type { LocalReservation } from "@/lib/availability/local-store";
import { createLocalBooking } from "@/lib/booking/create-reservation";
import { resetLocalBookingStore } from "@/lib/availability/local-store";
import { resetLocalPayments } from "@/lib/payments/local-store";
import {
  queuePostCheckoutReviewRequest,
  resetReviewRequests,
  listReviewRequests,
} from "@/lib/reviews/post-checkout-request";
import { resetLocalOpsNotifications } from "@/lib/ops/local-notifications";
import { resetHousekeepingTasks } from "@/lib/ops/housekeeping";

beforeEach(() => {
  resetLocalBookingStore();
  resetLocalPayments();
  resetReviewRequests();
  resetLocalOpsNotifications();
  resetHousekeepingTasks();
});

function baseRes(
  overrides: Partial<LocalReservation>,
): LocalReservation {
  return {
    id: "1",
    reservation_code: "LH-TEST01",
    organization_id: "org",
    property_id: "p1",
    room_id: null,
    room_type_id: null,
    guest_name: "Test",
    guest_phone: "",
    guest_email: "",
    check_in: "2026-10-01",
    check_out: "2026-10-03",
    guests: 2,
    price: 100000,
    status: "confirmed",
    payment_status: "unpaid",
    extras: [],
    source: "web",
    channel: "direct",
    notes: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("front desk day view", () => {
  it("clasifica arrivals / departures / in-house", () => {
    const day = buildFrontDeskDay(
      [
        baseRes({ id: "a", reservation_code: "LH-A", check_in: "2026-10-02", check_out: "2026-10-05" }),
        baseRes({
          id: "b",
          reservation_code: "LH-B",
          check_in: "2026-09-28",
          check_out: "2026-10-02",
          status: "checked_in",
        }),
        baseRes({
          id: "c",
          reservation_code: "LH-C",
          check_in: "2026-10-01",
          check_out: "2026-10-04",
          status: "checked_in",
        }),
      ],
      "2026-10-02",
    );
    expect(day.arrivals.map((r) => r.reservation_code)).toContain("LH-A");
    expect(day.departures.map((r) => r.reservation_code)).toContain("LH-B");
    expect(day.in_house.map((r) => r.reservation_code)).toEqual(
      expect.arrayContaining(["LH-A", "LH-C"]),
    );
  });
});

describe("post-checkout review stub", () => {
  it("encola una sola vez por código", () => {
    const a = queuePostCheckoutReviewRequest({
      reservationCode: "LH-REV1",
      guestName: "Ana",
    });
    const b = queuePostCheckoutReviewRequest({
      reservationCode: "LH-REV1",
      guestName: "Ana",
    });
    expect(a.id).toBe(b.id);
    expect(listReviewRequests()).toHaveLength(1);
    expect(a.review_url).toContain("LH-REV1");
  });
});

describe("corporate channel booking", () => {
  it("persiste channel corporate", () => {
    const r = createLocalBooking({
      checkIn: "2026-11-10",
      checkOut: "2026-11-12",
      guests: 1,
      guestName: "Corp Guest",
      categoryId: "vista",
      channel: "corporate",
      corporateName: "Acme",
      price: 200000,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reservation.channel).toBe("corporate");
    expect(r.reservation.corporate_name).toBe("Acme");
  });
});
