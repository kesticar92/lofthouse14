/**
 * Payments locales (stub) — pending al booking sin pasarela real.
 */

export type LocalPayment = {
  id: string;
  organization_id: string;
  reservation_id: string | null;
  reservation_code: string;
  provider: string;
  external_id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "stub";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
};

const g = globalThis as unknown as {
  __lhLocalPayments?: Map<string, LocalPayment>;
};

function map() {
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
}): LocalPayment {
  const now = new Date().toISOString();
  const amount = Math.max(0, Math.round(input.amount || 0));
  const row: LocalPayment = {
    id: newId(),
    organization_id: input.organizationId,
    reservation_id: input.reservationId ?? null,
    reservation_code: input.reservationCode.trim().toUpperCase(),
    provider: input.provider ?? "stub",
    external_id: `local_${Date.now()}`,
    amount,
    amount_paid: 0,
    currency: input.currency ?? "COP",
    status: amount > 0 ? "pending" : "paid",
    created_at: now,
    updated_at: now,
    metadata: input.metadata,
  };
  map().set(row.id, row);
  map().set(`code:${row.reservation_code}`, row);
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
} {
  const total = p.amount;
  const paid = p.amount_paid;
  const due = Math.max(0, total - paid);
  return { total, paid, due };
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
  return p;
}

export function resetLocalPayments() {
  g.__lhLocalPayments = new Map();
}
