import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  getLocalReservationByCode,
  listLocalReservations,
  upsertLocalReservation,
} from "@/lib/availability/local-store";
import { buildFrontDeskDay } from "@/lib/ops/front-desk";
import { createDirtyTaskOnCheckout } from "@/lib/ops/housekeeping";
import { queuePostCheckoutReviewRequest } from "@/lib/reviews/post-checkout-request";
import { recordLocalAudit } from "@/lib/audit/local-audit";
import { pushLocalOpsNotification } from "@/lib/ops/local-notifications";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "reservas");
  if (denied) return denied;

  const day =
    new URL(req.url).searchParams.get("date")?.trim() || todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return Response.json({ error: "date inválida (YYYY-MM-DD)" }, { status: 400 });
  }

  const dayView = buildFrontDeskDay(listLocalReservations(), day);
  return Response.json({
    ok: true,
    mode: "local",
    note: "Front desk sobre store local durable; con Supabase se puede enriquecer.",
    ...dayView,
  });
}

/**
 * Quick check-in / check-out local (front desk).
 */
export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "reservas");
  if (denied) return denied;

  let body: {
    action?: "check_in" | "check_out";
    reservation_code?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const code = body.reservation_code?.trim().toUpperCase();
  if (!code || (body.action !== "check_in" && body.action !== "check_out")) {
    return Response.json(
      { error: "action (check_in|check_out) y reservation_code requeridos" },
      { status: 400 },
    );
  }

  const local = getLocalReservationByCode(code);
  if (!local) {
    return Response.json(
      { error: "Reserva local no encontrada", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  if (local.status === "cancelled") {
    return Response.json({ error: "Reserva cancelada" }, { status: 400 });
  }

  if (body.action === "check_in") {
    local.status = "checked_in";
    local.updated_at = new Date().toISOString();
    upsertLocalReservation(local);
    pushLocalOpsNotification({
      title: `Check-in · ${code}`,
      message: `${local.guest_name} ingresó`,
      level: "info",
      href: "/admin/front-desk",
      source: "front_desk",
    });
    recordLocalAudit({
      action: "front_desk.check_in",
      entity_type: "reservation",
      entity_id: code,
      actor: gate.ctx.user?.email ?? "staff",
    });
    return Response.json({ ok: true, reservation: local });
  }

  local.status = "checked_out";
  local.updated_at = new Date().toISOString();
  upsertLocalReservation(local);

  const hk = createDirtyTaskOnCheckout({
    reservationCode: code,
    propertyId: local.property_id,
    roomId: local.room_id,
  });

  const review = queuePostCheckoutReviewRequest({
    reservationCode: code,
    guestName: local.guest_name,
    guestEmail: local.guest_email,
    checkIn: local.check_in,
    checkOut: local.check_out,
  });

  recordLocalAudit({
    action: "front_desk.check_out",
    entity_type: "reservation",
    entity_id: code,
    actor: gate.ctx.user?.email ?? "staff",
    metadata: { housekeeping_task: hk.id, review_request: review.id },
  });

  return Response.json({
    ok: true,
    reservation: local,
    housekeeping: hk,
    review_request: review,
  });
}
