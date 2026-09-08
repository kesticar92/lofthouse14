/**
 * Folio local en memoria — cargos, pagos manuales y saldo.
 */

import type { LocalReservation } from "@/lib/availability/local-store";
import {
  balanceForPayment,
  createLocalPendingPayment,
  getLocalPaymentByCode,
  markLocalPaymentPaid,
  type LocalPayment,
} from "@/lib/payments/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import type {
  FolioBalance,
  FolioCharge,
  FolioChargeKind,
  FolioPaymentLine,
  FolioPaymentMethod,
  GuestFolio,
} from "./types";

const g = globalThis as unknown as {
  __lhGuestFolios?: Map<string, GuestFolio>;
};

function map() {
  if (!g.__lhGuestFolios) g.__lhGuestFolios = new Map();
  return g.__lhGuestFolios;
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function computeFolioBalance(folio: GuestFolio): FolioBalance {
  const charges_total = folio.charges.reduce(
    (s, c) => s + Math.round(c.amount) * Math.max(1, c.quantity),
    0,
  );
  const payments_total = folio.payments.reduce(
    (s, p) => s + Math.round(p.amount),
    0,
  );
  return {
    charges_total,
    payments_total,
    balance: charges_total - payments_total,
  };
}

function seedChargesFromReservation(res: LocalReservation): FolioCharge[] {
  const now = new Date().toISOString();
  const charges: FolioCharge[] = [];
  const nights = nightsBetween(res.check_in, res.check_out);
  const extras = Array.isArray(res.extras) ? res.extras : [];
  let extrasSum = 0;
  for (const raw of extras) {
    const e = raw as { id?: string; label?: string; amountCop?: number };
    const amount = Math.round(Number(e.amountCop ?? 0) || 0);
    if (amount <= 0 && !e.label) continue;
    extrasSum += amount;
    charges.push({
      id: newId("chg"),
      kind: "extra",
      label: e.label || e.id || "Extra",
      amount,
      quantity: 1,
      created_at: now,
    });
  }
  const roomAmount = Math.max(
    0,
    Math.round((res.price ?? 0) - extrasSum),
  );
  if (roomAmount > 0 || (res.price ?? 0) > 0) {
    charges.unshift({
      id: newId("chg"),
      kind: "room",
      label:
        nights > 0
          ? `Alojamiento (${nights} noche${nights === 1 ? "" : "s"})`
          : "Alojamiento",
      amount: roomAmount > 0 ? roomAmount : Math.round(res.price ?? 0),
      quantity: 1,
      created_at: now,
    });
  }
  return charges;
}

function seedPaymentsFromLocalPayment(
  payment: LocalPayment | null,
): FolioPaymentLine[] {
  if (!payment || payment.amount_paid <= 0) return [];
  return [
    {
      id: newId("pay"),
      method: "card_stub",
      amount: payment.amount_paid,
      created_at: payment.updated_at || payment.created_at,
      notes: `Desde payment ${payment.provider}`,
    },
  ];
}

/** Obtiene o crea folio a partir de reserva + payment local. */
export function ensureFolioForReservation(res: LocalReservation): GuestFolio {
  const code = res.reservation_code.trim().toUpperCase();
  const existing = map().get(code);
  if (existing) {
    existing.guest_name = res.guest_name || existing.guest_name;
    existing.check_in = res.check_in;
    existing.check_out = res.check_out;
    existing.nights = nightsBetween(res.check_in, res.check_out);
    existing.updated_at = new Date().toISOString();
    map().set(code, existing);
    return existing;
  }

  const payment = getLocalPaymentByCode(code);
  const now = new Date().toISOString();
  const folio: GuestFolio = {
    reservation_code: code,
    organization_id: res.organization_id || LOFTHOUSE_ORGANIZATION_ID,
    guest_name: res.guest_name || "Huésped",
    check_in: res.check_in,
    check_out: res.check_out,
    nights: nightsBetween(res.check_in, res.check_out),
    charges: seedChargesFromReservation(res),
    payments: seedPaymentsFromLocalPayment(payment),
    currency: "COP",
    created_at: now,
    updated_at: now,
  };
  map().set(code, folio);
  return folio;
}

export function getFolio(code: string): GuestFolio | null {
  return map().get(code.trim().toUpperCase()) ?? null;
}

export function listFolios(): GuestFolio[] {
  return [...map().values()].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
}

export function addFolioCharge(
  code: string,
  input: {
    label: string;
    amount: number;
    kind?: FolioChargeKind;
    quantity?: number;
    notes?: string;
  },
): GuestFolio | null {
  const folio = map().get(code.trim().toUpperCase());
  if (!folio) return null;
  const amount = Math.round(Number(input.amount) || 0);
  if (!input.label.trim() || !Number.isFinite(amount)) return null;
  folio.charges.push({
    id: newId("chg"),
    kind: input.kind ?? "addon",
    label: input.label.trim(),
    amount,
    quantity: Math.max(1, Math.floor(input.quantity ?? 1)),
    created_at: new Date().toISOString(),
    notes: input.notes?.trim() || undefined,
  });
  folio.updated_at = new Date().toISOString();
  syncPaymentAmount(folio);
  map().set(folio.reservation_code, folio);
  return folio;
}

export function registerFolioPayment(
  code: string,
  input: {
    amount: number;
    method: FolioPaymentMethod;
    notes?: string;
  },
): GuestFolio | null {
  const folio = map().get(code.trim().toUpperCase());
  if (!folio) return null;
  const amount = Math.round(Number(input.amount) || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  folio.payments.push({
    id: newId("pay"),
    method: input.method,
    amount,
    created_at: new Date().toISOString(),
    notes: input.notes?.trim() || undefined,
  });
  folio.updated_at = new Date().toISOString();
  syncPaymentAmount(folio);
  map().set(folio.reservation_code, folio);
  return folio;
}

/** Marca saldo 0 con ajuste (pago o crédito). */
export function settleFolioBalance(code: string): GuestFolio | null {
  const folio = map().get(code.trim().toUpperCase());
  if (!folio) return null;
  const { balance } = computeFolioBalance(folio);
  if (balance === 0) return folio;
  const now = new Date().toISOString();
  if (balance > 0) {
    folio.payments.push({
      id: newId("pay"),
      method: "adjustment",
      amount: balance,
      created_at: now,
      notes: "Saldo marcado en 0 (ajuste administrativo)",
    });
  } else {
    folio.charges.push({
      id: newId("chg"),
      kind: "adjustment",
      label: "Ajuste saldo a favor",
      amount: Math.abs(balance),
      quantity: 1,
      created_at: now,
      notes: "Saldo marcado en 0",
    });
  }
  folio.updated_at = now;
  syncPaymentAmount(folio);
  map().set(folio.reservation_code, folio);
  return folio;
}

function syncPaymentAmount(folio: GuestFolio) {
  const bal = computeFolioBalance(folio);
  let payment = getLocalPaymentByCode(folio.reservation_code);
  if (!payment) {
    payment = createLocalPendingPayment({
      organizationId: folio.organization_id,
      reservationCode: folio.reservation_code,
      amount: Math.max(0, bal.charges_total),
      provider: "folio",
      metadata: { synced_from: "folio" },
    });
  } else {
    payment.amount = Math.max(0, bal.charges_total);
    payment.amount_paid = Math.min(bal.payments_total, payment.amount);
    const deposit =
      payment.deposit_amount > 0
        ? payment.deposit_amount
        : Math.round((payment.amount * (payment.deposit_percent || 30)) / 100);
    if (payment.amount_paid >= payment.amount && payment.amount > 0) {
      payment.status = "paid";
    } else if (payment.amount === 0) {
      payment.status = "paid";
    } else if (
      deposit > 0 &&
      payment.amount_paid >= deposit &&
      payment.amount_paid < payment.amount
    ) {
      payment.status = "deposit_paid";
      payment.deposit_amount = deposit;
    } else if (payment.amount_paid > 0) {
      payment.status = "pending";
    } else {
      payment.status = "pending";
    }
    payment.updated_at = new Date().toISOString();
  }
  if (bal.balance <= 0 && bal.charges_total > 0) {
    markLocalPaymentPaid(folio.reservation_code, bal.payments_total);
  }
  void balanceForPayment(payment);
}

export function resetFolios() {
  g.__lhGuestFolios = new Map();
}
