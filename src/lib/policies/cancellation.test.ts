import { describe, expect, it } from "vitest";
import {
  applyCancellationFeeStub,
  resolveCancelFeePercent,
  SEED_CANCELLATION_POLICY,
} from "./cancellation";

describe("cancellation policies", () => {
  it("seed tiene tiers y no-show 100%", () => {
    expect(SEED_CANCELLATION_POLICY.tiers.length).toBeGreaterThanOrEqual(3);
    expect(SEED_CANCELLATION_POLICY.noShowFeePercentOfDeposit).toBe(100);
  });

  it("más de 7 días → 20%", () => {
    const { percent, tierId } = resolveCancelFeePercent(
      SEED_CANCELLATION_POLICY,
      8 * 24,
      "guest_cancel",
    );
    expect(percent).toBe(20);
    expect(tierId).toBe("early");
  });

  it("aplica fee stub sobre depósito", () => {
    const fee = applyCancellationFeeStub({
      checkIn: "2099-01-15",
      depositAmount: 300_000,
      reason: "guest_cancel",
      now: new Date("2099-01-01T12:00:00Z"),
    });
    expect(fee.fee_percent).toBe(20);
    expect(fee.fee_amount).toBe(60_000);
    expect(fee.note).toMatch(/stub/i);
  });

  it("no-show 100%", () => {
    const fee = applyCancellationFeeStub({
      checkIn: "2026-01-01",
      depositAmount: 100_000,
      reason: "no_show",
    });
    expect(fee.fee_amount).toBe(100_000);
  });
});
