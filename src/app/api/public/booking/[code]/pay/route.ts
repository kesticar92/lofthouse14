import { getDraftInvoiceByCode } from "@/lib/einvoicing/provider";
import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createLocalPendingPayment,
  getLocalPaymentByCode,
  markLocalPaymentPaid,
  balanceForPayment,
} from "@/lib/payments/local-store";
import {
  ensureFolioForReservation,
  registerFolioPayment,
  settleFolioBalance,
} from "@/lib/folio/store";
import { upsertLocalReservation } from "@/lib/availability/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { getStubFxRates, formatMoney } from "@/lib/currency/rates";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Guest-facing mock pay — simula Wompi/stub sin secretos.
 * TODO: REAL INTEGRATION REQUIRED para checkout live.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  let body: { simulate?: boolean; amount?: number } = {};
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
    const amount =
      Number(body.amount) > 0
        ? Number(body.amount)
        : reservation.price != null && reservation.price > 0
          ? reservation.price
          : 100_000;
    payment = createLocalPendingPayment({
      organizationId: LOFTHOUSE_ORGANIZATION_ID,
      reservationId: reservation.id,
      reservationCode: code,
      amount,
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

  const paid = markLocalPaymentPaid(code);
  reservation.payment_status = "paid";
  upsertLocalReservation(reservation);
  ensureFolioForReservation(reservation);
  registerFolioPayment(code, {
    amount: paid?.amount ?? payment.amount,
    method: "wompi_mock_guest",
    reference: `guest-sim-${code}`,
  });
  settleFolioBalance(code);

  const fx = getStubFxRates();
  return Response.json({
    ok: true,
    mode: "mock",
    note: "Simulación guest portal — no es cargo real. TODO: REAL INTEGRATION REQUIRED.",
    payment: paid
      ? { ...paid, balance: balanceForPayment(paid) }
      : null,
    reservation: {
      reservation_code: reservation.reservation_code,
      payment_status: reservation.payment_status,
      status: reservation.status,
    },
    display: {
      cop: formatMoney(paid?.amount ?? payment.amount, "COP", fx),
      usd: formatMoney(paid?.amount ?? payment.amount, "USD", fx),
      disclaimer: fx.disclaimer,
    },
    invoice_draft: getDraftInvoiceByCode(code),
  });
}
