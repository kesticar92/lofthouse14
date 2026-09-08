import { getDraftInvoiceByCode } from "@/lib/einvoicing/provider";
import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import {
  createLocalPendingPayment,
  getLocalPaymentByCode,
  markLocalPaymentPaid,
  markLocalDepositPaid,
  balanceForPayment,
} from "@/lib/payments/local-store";
import { computeDepositAmounts } from "@/lib/payments/deposit";
import {
  ensureFolioForReservation,
  registerFolioPayment,
  settleFolioBalance,
} from "@/lib/folio/store";
import { upsertLocalReservation } from "@/lib/availability/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { getStubFxRates, formatMoney } from "@/lib/currency/rates";
import { recordLocalAudit } from "@/lib/audit/local-audit";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Guest-facing mock pay — depósito o saldo completo (sin Wompi live).
 * body.kind: "deposit" | "balance" | "full" (default deposit si hay depósito pendiente)
 * TODO: REAL INTEGRATION REQUIRED para checkout live.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  let body: {
    simulate?: boolean;
    amount?: number;
    kind?: "deposit" | "balance" | "full";
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (body.simulate === false) {
    return Response.json(
      {
        error:
          "Pago live no disponible sin WOMPI keys. Usa simulate=true (mock). TODO: REAL INTEGRATION REQUIRED.",
      },
      { status: 501 },
    );
  }

  const reservation = lookupLocalBooking(code);
  if (!reservation) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  let payment = getLocalPaymentByCode(code);
  if (!payment) {
    const total =
      Number(body.amount) > 0
        ? Number(body.amount)
        : reservation.price != null && reservation.price > 0
          ? reservation.price
          : 100_000;
    const dep = computeDepositAmounts(total);
    payment = createLocalPendingPayment({
      organizationId: LOFTHOUSE_ORGANIZATION_ID,
      reservationId: reservation.id,
      reservationCode: code,
      amount: dep.total,
      depositAmount: dep.deposit,
      depositPercent: dep.percent,
      provider: "wompi",
      metadata: { guest_simulate: true },
    });
  }

  if (payment.status === "paid") {
    return Response.json({
      ok: true,
      already_paid: true,
      payment: { ...payment, balance: balanceForPayment(payment) },
      invoice_draft: getDraftInvoiceByCode(code),
      note: "Pago ya registrado (mock).",
    });
  }

  const bal = balanceForPayment(payment);
  const kind =
    body.kind ??
    (payment.status === "deposit_paid" || bal.deposit_due <= 0
      ? "balance"
      : "deposit");

  let paid = payment;
  let payAmount = 0;
  let note = "";

  if (kind === "deposit") {
    if (bal.deposit_due <= 0 && payment.status === "deposit_paid") {
      return Response.json({
        ok: true,
        already_paid: true,
        kind: "deposit",
        payment: { ...payment, balance: bal },
        note: "Depósito ya pagado (mock).",
      });
    }
    const updated = markLocalDepositPaid(code);
    if (!updated) {
      return Response.json({ error: "No se pudo registrar depósito" }, { status: 500 });
    }
    paid = updated;
    payAmount = updated.deposit_amount;
    reservation.payment_status = "deposit_paid";
    note =
      "Depósito mock registrado. Saldo pendiente al check-in. TODO: REAL INTEGRATION REQUIRED.";
  } else {
    const updated = markLocalPaymentPaid(code);
    if (!updated) {
      return Response.json({ error: "No se pudo registrar pago" }, { status: 500 });
    }
    paid = updated;
    payAmount = updated.amount;
    reservation.payment_status = "paid";
    note =
      kind === "balance"
        ? "Saldo mock liquidado. No es cargo real."
        : "Pago total mock registrado. No es un cargo real.";
  }

  upsertLocalReservation(reservation);
  ensureFolioForReservation(reservation);
  registerFolioPayment(code, {
    amount:
      kind === "deposit"
        ? payAmount
        : Math.max(
            0,
            (paid.amount - (payment.amount_paid || 0)) || payAmount,
          ),
    method: "wompi_mock",
    notes: `guest-${kind}-${code}`,
  });
  if (kind === "full" || kind === "balance" || paid.status === "paid") {
    settleFolioBalance(code);
  }

  // Re-leer tras sync de folio (puede ajustar status deposit_paid/paid)
  const latest = getLocalPaymentByCode(code) ?? paid;
  if (
    kind === "deposit" &&
    latest.status !== "paid" &&
    latest.amount_paid >= latest.deposit_amount
  ) {
    latest.status = "deposit_paid";
  }
  paid = latest;

  recordLocalAudit({
    action: kind === "deposit" ? "payment.deposit_mock" : "payment.pay_mock",
    entity_type: "payment",
    entity_id: code,
    metadata: {
      kind,
      amount: payAmount,
      status: paid.status,
      total: paid.amount,
      deposit: paid.deposit_amount,
    },
  });

  const fx = getStubFxRates();
  const balance = balanceForPayment(paid);
  return Response.json({
    ok: true,
    mode: "mock",
    kind,
    note,
    payment: { ...paid, balance },
    deposit: {
      percent: paid.deposit_percent,
      amount: paid.deposit_amount,
      paid: Math.min(paid.amount_paid, paid.deposit_amount),
      due: balance.deposit_due,
      balance_due: balance.due,
    },
    reservation: {
      reservation_code: reservation.reservation_code,
      payment_status: reservation.payment_status,
      status: reservation.status,
    },
    display: {
      cop: formatMoney(payAmount, "COP", fx),
      usd: formatMoney(payAmount, "USD", fx),
      disclaimer: fx.disclaimer,
    },
    invoice_draft: getDraftInvoiceByCode(code),
  });
}
