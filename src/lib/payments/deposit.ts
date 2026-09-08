/**
 * Depósito configurable (% del total) — stub sin pasarela live.
 */

export const DEFAULT_DEPOSIT_PERCENT = 30;

export function depositPercentFromEnv(): number {
  const n = Number(process.env.BOOKING_DEPOSIT_PERCENT);
  if (Number.isFinite(n) && n > 0 && n <= 100) return Math.floor(n);
  return DEFAULT_DEPOSIT_PERCENT;
}

export function computeDepositAmounts(
  totalCop: number,
  percent: number = depositPercentFromEnv(),
): {
  total: number;
  deposit: number;
  balance_due: number;
  percent: number;
} {
  const total = Math.max(0, Math.round(totalCop || 0));
  const pct = Math.min(100, Math.max(1, Math.floor(percent)));
  const deposit =
    total <= 0 ? 0 : Math.max(1, Math.round((total * pct) / 100));
  const balance_due = Math.max(0, total - deposit);
  return { total, deposit, balance_due, percent: pct };
}
