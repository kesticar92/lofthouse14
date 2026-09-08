import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import {
  getLocalReservationByCode,
  upsertLocalReservation,
} from "@/lib/availability/local-store";
import { getLocalPaymentByCode } from "@/lib/payments/local-store";
import {
  applyCancellationFeeStub,
  listSeedPolicies,
} from "@/lib/policies/cancellation";
import {
  addFolioCharge,
  ensureFolioForReservation,
} from "@/lib/folio/store";
import { recordLocalAudit } from "@/lib/audit/local-audit";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Cancelación guest stub — aplica fee según política seed.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  let body: { reason?: "guest_cancel" | "no_show"; confirm?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const reservation =
    lookupLocalBooking(code) ?? getLocalReservationByCode(code);
  if (!reservation) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }
  if (reservation.status === "cancelled") {
    return Response.json({
      ok: true,
      already_cancelled: true,
      reservation,
      policies: listSeedPolicies(),
    });
  }

  const payment = getLocalPaymentByCode(code);
  const depositBase =
    payment?.deposit_amount ||
    payment?.amount_paid ||
    Math.round((reservation.price ?? 0) * 0.3) ||
    0;

  const fee = applyCancellationFeeStub({
    checkIn: reservation.check_in,
    depositAmount: depositBase,
    reason: body.reason === "no_show" ? "no_show" : "guest_cancel",
  });

  reservation.status =
    body.reason === "no_show" ? "no_show" : "cancelled";
  reservation.payment_status =
    fee.fee_amount > 0 ? "cancelled_with_fee" : "cancelled";
  reservation.updated_at = new Date().toISOString();
  reservation.notes = [
    reservation.notes,
    `cancel_fee stub ${fee.fee_amount} (${fee.fee_percent}% · ${fee.tier_id})`,
  ]
    .filter(Boolean)
    .join(" | ");
  upsertLocalReservation(reservation);

  const folio = ensureFolioForReservation(reservation);
  if (fee.fee_amount > 0) {
    addFolioCharge(code, {
      kind: "adjustment",
      label: `Fee cancelación (${fee.tier_id ?? fee.reason})`,
      amount: fee.fee_amount,
      notes: fee.note,
    });
  }

  recordLocalAudit({
    action:
      body.reason === "no_show"
        ? "booking.no_show"
        : "booking.cancel_guest",
    entity_type: "reservation",
    entity_id: code,
    metadata: {
      fee_amount: fee.fee_amount,
      fee_percent: fee.fee_percent,
      tier: fee.tier_id,
      check_in: reservation.check_in,
    },
  });

  return Response.json({
    ok: true,
    mode: "local_stub",
    reservation,
    fee,
    folio_code: folio.reservation_code,
    policies: listSeedPolicies(),
    note: fee.note,
  });
}
