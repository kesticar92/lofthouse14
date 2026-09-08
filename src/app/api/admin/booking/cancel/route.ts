import { requireStaff } from "@/lib/api/require-staff";
import {
  getLocalReservationByCode,
  listLocalReservations,
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
import { createDirtyTaskOnCheckout } from "@/lib/ops/housekeeping";

/**
 * Admin cancel / no-show con fee stub + opcional dirty HK.
 */
export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  let body: {
    reservation_code?: string;
    reason?: "admin_cancel" | "no_show";
  } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const code = body.reservation_code?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "reservation_code requerido" }, { status: 400 });
  }

  const reservation = getLocalReservationByCode(code);
  if (!reservation) {
    return Response.json(
      {
        error:
          "Reserva local no encontrada (solo store local en este stub; Supabase cancel vía PMS PATCH).",
      },
      { status: 404 },
    );
  }

  const reason = body.reason === "no_show" ? "no_show" : "admin_cancel";
  const payment = getLocalPaymentByCode(code);
  const depositBase =
    payment?.deposit_amount ||
    payment?.amount_paid ||
    Math.round((reservation.price ?? 0) * 0.3) ||
    0;

  const fee = applyCancellationFeeStub({
    checkIn: reservation.check_in,
    depositAmount: depositBase,
    reason: reason === "no_show" ? "no_show" : "admin_cancel",
  });

  reservation.status = reason === "no_show" ? "no_show" : "cancelled";
  reservation.updated_at = new Date().toISOString();
  reservation.notes = [
    reservation.notes,
    `admin_${reason}_fee ${fee.fee_amount}`,
  ]
    .filter(Boolean)
    .join(" | ");
  upsertLocalReservation(reservation);

  ensureFolioForReservation(reservation);
  if (fee.fee_amount > 0) {
    addFolioCharge(code, {
      kind: "adjustment",
      label: `Fee ${reason} (${fee.tier_id})`,
      amount: fee.fee_amount,
      notes: fee.note,
    });
  }

  let hk = null;
  if (reason === "no_show") {
    hk = createDirtyTaskOnCheckout({
      reservationCode: code,
      propertyId: reservation.property_id,
      roomId: reservation.room_id,
    });
  }

  recordLocalAudit({
    action: reason === "no_show" ? "booking.no_show" : "booking.cancel_admin",
    entity_type: "reservation",
    entity_id: code,
    actor: gate.ctx.user?.email ?? gate.ctx.user?.id ?? "staff",
    metadata: {
      fee_amount: fee.fee_amount,
      fee_percent: fee.fee_percent,
      tier: fee.tier_id,
    },
  });

  return Response.json({
    ok: true,
    reservation,
    fee,
    housekeeping: hk,
    policies: listSeedPolicies(),
    local_count: listLocalReservations().length,
    note: fee.note,
  });
}
