/**
 * Smoke tenant/booking — no depende de prod Supabase.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { createLocalBooking } from "@/lib/booking/create-reservation";
import { resetLocalBookingStore } from "@/lib/availability/local-store";
import {
  getLocalPaymentByCode,
  resetLocalPayments,
} from "@/lib/payments/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { seedModuleFlagsForOrg } from "@/lib/saas/module-flags";
import { enforceOrganizationId } from "@/lib/tenant/organization";

beforeEach(() => {
  resetLocalBookingStore();
  resetLocalPayments();
});

describe("smoke tenant + booking (local)", () => {
  it("org seed + enforceOrganizationId", () => {
    const seed = seedModuleFlagsForOrg({
      organizationId: LOFTHOUSE_ORGANIZATION_ID,
    });
    expect(seed.organization_id).toBe(LOFTHOUSE_ORGANIZATION_ID);
    expect(enforceOrganizationId(LOFTHOUSE_ORGANIZATION_ID)).toBeNull();
  });

  it("booking crea payment pending", () => {
    const r = createLocalBooking({
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
      guestName: "Smoke Guest",
      categoryId: "vista",
      price: 200_000,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const pay = getLocalPaymentByCode(r.reservation.reservation_code);
    expect(pay?.status).toBe("pending");
    expect(pay?.amount).toBe(200_000);
  });
});
