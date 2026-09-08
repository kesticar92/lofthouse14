/**
 * Políticas de cancelación / no-show (seed + fee stub).
 * No es cobro real — solo cálculo para folio / admin.
 */

export type CancellationTier = {
  id: string;
  label: string;
  /** Horas mínimas antes del check-in (inclusive) para este tramo */
  minHoursBeforeCheckIn: number;
  /** % del depósito (o total si no hay depósito) retenido */
  feePercentOfDeposit: number;
};

export type CancellationPolicy = {
  id: string;
  name: string;
  currency: "COP";
  tiers: CancellationTier[];
  noShowFeePercentOfDeposit: number;
  description: string;
};

export const SEED_CANCELLATION_POLICY: CancellationPolicy = {
  id: "lh-standard-v1",
  name: "Política estándar Lofthouse 14",
  currency: "COP",
  description:
    "Seed local: >7 días 20% fee del depósito; 3–7 días 50%; <72h 100%. No-show: 100% del depósito.",
  noShowFeePercentOfDeposit: 100,
  tiers: [
    {
      id: "early",
      label: "Más de 7 días",
      minHoursBeforeCheckIn: 7 * 24,
      feePercentOfDeposit: 20,
    },
    {
      id: "mid",
      label: "Entre 3 y 7 días",
      minHoursBeforeCheckIn: 3 * 24,
      feePercentOfDeposit: 50,
    },
    {
      id: "late",
      label: "Menos de 72 horas",
      minHoursBeforeCheckIn: 0,
      feePercentOfDeposit: 100,
    },
  ],
};

export type CancellationFeeResult = {
  policy_id: string;
  reason: "guest_cancel" | "admin_cancel" | "no_show";
  hours_before_check_in: number;
  deposit_base: number;
  fee_percent: number;
  fee_amount: number;
  tier_id: string | null;
  note: string;
};

function hoursUntil(checkInIsoDate: string, now: Date = new Date()): number {
  const checkIn = Date.parse(`${checkInIsoDate}T15:00:00`);
  if (!Number.isFinite(checkIn)) return 0;
  return (checkIn - now.getTime()) / 3_600_000;
}

export function resolveCancelFeePercent(
  policy: CancellationPolicy,
  hoursBefore: number,
  reason: CancellationFeeResult["reason"],
): { percent: number; tierId: string | null } {
  if (reason === "no_show") {
    return {
      percent: policy.noShowFeePercentOfDeposit,
      tierId: "no_show",
    };
  }
  const sorted = [...policy.tiers].sort(
    (a, b) => b.minHoursBeforeCheckIn - a.minHoursBeforeCheckIn,
  );
  for (const tier of sorted) {
    if (hoursBefore >= tier.minHoursBeforeCheckIn) {
      return { percent: tier.feePercentOfDeposit, tierId: tier.id };
    }
  }
  return { percent: 100, tierId: "late" };
}

export function applyCancellationFeeStub(input: {
  checkIn: string;
  depositAmount: number;
  reason?: CancellationFeeResult["reason"];
  policy?: CancellationPolicy;
  now?: Date;
}): CancellationFeeResult {
  const policy = input.policy ?? SEED_CANCELLATION_POLICY;
  const reason = input.reason ?? "guest_cancel";
  const hours = hoursUntil(input.checkIn, input.now ?? new Date());
  const { percent, tierId } = resolveCancelFeePercent(policy, hours, reason);
  const deposit_base = Math.max(0, Math.round(input.depositAmount || 0));
  const fee_amount = Math.round((deposit_base * percent) / 100);
  return {
    policy_id: policy.id,
    reason,
    hours_before_check_in: Math.round(hours * 10) / 10,
    deposit_base,
    fee_percent: percent,
    fee_amount,
    tier_id: tierId,
    note: "Fee stub — no cargo real. TODO: REAL INTEGRATION REQUIRED.",
  };
}

export function listSeedPolicies(): CancellationPolicy[] {
  return [SEED_CANCELLATION_POLICY];
}
