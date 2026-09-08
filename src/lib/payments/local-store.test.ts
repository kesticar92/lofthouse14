import { describe, expect, it, beforeEach } from "vitest";
import {
  createLocalPendingPayment,
  getLocalPaymentByCode,
  balanceForPayment,
  markLocalPaymentPaid,
  resetLocalPayments,
} from "./local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

beforeEach(() => {
  resetLocalPayments();
});

describe("local payments", () => {
  it("crea pending y calcula saldo", () => {
    const p = createLocalPendingPayment({
      organizationId: LOFTHOUSE_ORGANIZATION_ID,
      reservationCode: "LH-PAY001",
      amount: 270_000,
    });
    expect(p.status).toBe("pending");
    expect(balanceForPayment(p).due).toBe(270_000);
    expect(getLocalPaymentByCode("lh-pay001")?.id).toBe(p.id);

    const paid = markLocalPaymentPaid("LH-PAY001");
    expect(paid?.status).toBe("paid");
    expect(balanceForPayment(paid!).due).toBe(0);
  });
});
