/**
 * Payments locales (stub) — pending al booking sin pasarela real.
 * Soporta depósito % + saldo restante.
 * Persistencia durable: `.data/payments.json`.
 */

import { depositPercentFromEnv } from "@/lib/payments/deposit";
import {
  clearJsonFile,
  durableStoreEnabled,
  loadJsonFile,
  saveJsonFile,
} from "@/lib/persist/json-file-store";

export type LocalPayment = {
  id: string;
  organization_id: string;
  reservation_id: string | null;
  reservation_code: string;
  provider: string;
  external_id: string;
  /** Total de la estadía (COP) */
  amount: number;
  /** Monto del depósito configurado */
  deposit_amount: number;
  /** % deposit aplicado al crear */
  deposit_percent: number;
  amount_paid: number;
  currency: string;
  status:
    | "pending"
    | "deposit_paid"
    | "paid"
    | "failed"
    | "refunded"
    | "stub";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
};

type PaymentsSnapshot = { payments: LocalPayment[] };

const STORE_NAME = "payments";

const g = globalThis as unknown as {
  __lhLocalPayments?: Map<string, LocalPayment>;
  __lhPaymentsHydrated?: boolean;
};

function hydrateIfNeeded() {
  if (g.__lhPaymentsHydrated) return;
  g.__lhPaymentsHydrated = true;
  if (!durableStoreEnabled()) return;
  const snap = loadJsonFile<PaymentsSnapshot>(STORE_NAME);
  if (!snap?.payments?.length) return;
  const m = new Map<string, LocalPayment>();
  for (const row of snap.payments) {
    m.set(row.id, row);
    m.set(`code:${row.reservation_code}`, row);
  }
  g.__lhLocalPayments = m;
}

function persist() {
  if (!durableStoreEnabled()) return;
  saveJsonFile(STORE_NAME, { payments: listLocalPayments() } satisfies PaymentsSnapshot);
}

function map() {
  hydrateIfNeeded();
  if (!g.__lhLocalPayments) g.__lhLocalPayments = new Map();
  return g.__lhLocalPayments;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalPendingPayment(input: {
  organizationId: string;
  reservationId?: string | null;
  reservationCode: string;
  amount: number;
  currency?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
  /** Si se omite, se calcula con BOOKING_DEPOSIT_PERCENT / default 30% */
  depositAmount?: number;
  depositPercent?: number;
}): LocalPayment {
  const now = new Date().toISOString();
  const amount = Math.max(0, Math.round(input.amount || 0));
  const depositPercent =
    input.depositPercent ??
    (typeof input.metadata?.deposit_percent === "number"
      ? Number(input.metadata.deposit_percent)
      : depositPercentFromEnv());
  const deposit_amount =
    input.depositAmount != null
      ? Math.max(0, Math.round(input.depositAmount))
      : amount > 0
        ? Math.max(1, Math.round((amount * depositPercent) / 100))
        : 0;
  const row: LocalPayment = {
    id: newId(),
    organization_id: input.organizationId,
    reservation_id: input.reservationId ?? null,
    reservation_code: input.reservationCode.trim().toUpperCase(),
    provider: input.provider ?? "stub",
    external_id: `local_${Date.now()}`,
    amount,
    deposit_amount,
    deposit_percent: depositPercent,
    amount_paid: 0,
    currency: input.currency ?? "COP",
    status: amount > 0 ? "pending" : "paid",
    created_at: now,
    updated_at: now,
    metadata: {
      ...input.metadata,
      deposit_percent: depositPercent,
      deposit_amount,
      balance_due: Math.max(0, amount - deposit_amount),
    },
  };
  map().set(row.id, row);
  map().set(`code:${row.reservation_code}`, row);
  persist();
  return row;
}

export function getLocalPaymentByCode(code: string): LocalPayment | null {
  return map().get(`code:${code.trim().toUpperCase()}`) ?? null;
}

export function listLocalPayments(): LocalPayment[] {
  const seen = new Set<string>();
  const out: LocalPayment[] = [];
  for (const [k, v] of map()) {
    if (k.startsWith("code:")) continue;
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function balanceForPayment(p: LocalPayment): {
  total: number;
  paid: number;
  due: number;
  deposit: number;
  deposit_due: number;
  balance_after_deposit: number;
} {
  const total = p.amount;
  const paid = p.amount_paid;
  const due = Math.max(0, total - paid);
  const deposit = p.deposit_amount ?? Math.round((total * (p.deposit_percent || 30)) / 100);
  const deposit_due = Math.max(0, deposit - paid);
  const balance_after_deposit = Math.max(0, total - Math.max(paid, deposit));
  return { total, paid, due, deposit, deposit_due, balance_after_deposit };
}

export function markLocalDepositPaid(code: string): LocalPayment | null {
  const p = getLocalPaymentByCode(code);
  if (!p) return null;
  const deposit =
    p.deposit_amount > 0
      ? p.deposit_amount
      : Math.max(1, Math.round((p.amount * (p.deposit_percent || 30)) / 100));
  p.amount_paid = Math.max(p.amount_paid, deposit);
  p.deposit_amount = deposit;
  if (p.amount_paid >= p.amount) {
    p.status = "paid";
  } else {
    p.status = "deposit_paid";
  }
  p.updated_at = new Date().toISOString();
  map().set(p.id, p);
  map().set(`code:${p.reservation_code}`, p);
  persist();
  return p;
}

export function markLocalPaymentPaid(
  code: string,
  amountPaid?: number,
): LocalPayment | null {
  const p = getLocalPaymentByCode(code);
  if (!p) return null;
  p.amount_paid = amountPaid ?? p.amount;
  p.status = "paid";
  p.updated_at = new Date().toISOString();
  map().set(p.id, p);
  map().set(`code:${p.reservation_code}`, p);
  persist();
  return p;
}

export function resetLocalPayments() {
  g.__lhLocalPayments = new Map();
  clearJsonFile(STORE_NAME);
}
