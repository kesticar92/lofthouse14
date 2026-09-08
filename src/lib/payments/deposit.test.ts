import { describe, expect, it } from "vitest";
import {
  computeDepositAmounts,
  DEFAULT_DEPOSIT_PERCENT,
} from "./deposit";

describe("deposit", () => {
  it("calcula 30% por defecto", () => {
    const d = computeDepositAmounts(1_000_000, DEFAULT_DEPOSIT_PERCENT);
    expect(d.percent).toBe(30);
    expect(d.deposit).toBe(300_000);
    expect(d.balance_due).toBe(700_000);
  });

  it("redondea y no deja depósito 0 si total > 0", () => {
    const d = computeDepositAmounts(10, 30);
    expect(d.deposit).toBeGreaterThanOrEqual(1);
  });
});
