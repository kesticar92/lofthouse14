import { describe, expect, it, beforeEach } from "vitest";
import { buildStubOpsAlerts } from "./alerts";
import {
  createLocalMaintenanceTicket,
  resetLocalMaintenance,
} from "./maintenance";
import { resetLocalPayments, createLocalPendingPayment } from "@/lib/payments/local-store";
import { resetLocalBookingStore } from "@/lib/availability/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

beforeEach(() => {
  resetLocalMaintenance();
  resetLocalPayments();
  resetLocalBookingStore();
});

describe("buildStubOpsAlerts", () => {
  it("incluye mantenimiento y pagos pendientes", () => {
    createLocalMaintenanceTicket(LOFTHOUSE_ORGANIZATION_ID, {
      title: "AC roto",
      blocksAvailability: true,
    });
    createLocalPendingPayment({
      organizationId: LOFTHOUSE_ORGANIZATION_ID,
      reservationCode: "LH-ALERT1",
      amount: 100_000,
    });
    const alerts = buildStubOpsAlerts();
    expect(alerts.some((a) => a.id === "maint-open")).toBe(true);
    expect(alerts.some((a) => a.id === "payments-due")).toBe(true);
  });

  it("devuelve all-clear si no hay señales", () => {
    const alerts = buildStubOpsAlerts();
    expect(alerts.some((a) => a.id === "all-clear")).toBe(true);
  });
});
