import { requireStaff } from "@/lib/api/require-staff";
import {
  createDirtyTaskOnCheckout,
  listHousekeepingTasks,
  updateHousekeepingStatus,
} from "@/lib/ops/housekeeping";
import { HK_STATUSES, type HkStatus } from "@/lib/ops/maintenance";
import {
  getLocalReservationByCode,
  upsertLocalReservation,
} from "@/lib/availability/local-store";
import { recordLocalAudit } from "@/lib/audit/local-audit";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as HkStatus | null;
  const code = searchParams.get("reservation_code")?.trim();
  const tasks = listHousekeepingTasks({
    status: status && HK_STATUSES.includes(status) ? status : undefined,
    reservationCode: code || undefined,
  });
  return Response.json({ tasks, statuses: HK_STATUSES });
}

/**
 * POST: checkout local → dirty auto-task, o crear/actualizar manual.
 */
export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  let body: {
    action?: "checkout" | "update_status";
    reservation_code?: string;
    task_id?: string;
    status?: HkStatus;
    property_id?: string;
    room_id?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.action === "update_status") {
    if (!body.task_id || !body.status || !HK_STATUSES.includes(body.status)) {
      return Response.json(
        { error: "task_id y status válidos requeridos" },
        { status: 400 },
      );
    }
    const updated = updateHousekeepingStatus(body.task_id, body.status);
    if (!updated) {
      return Response.json({ error: "Tarea no encontrada" }, { status: 404 });
    }
    return Response.json({ ok: true, task: updated });
  }

  const code = body.reservation_code?.trim().toUpperCase();
  if (!code) {
    return Response.json(
      { error: "reservation_code requerido para checkout" },
      { status: 400 },
    );
  }

  const local = getLocalReservationByCode(code);
  if (local) {
    local.status = "checked_out";
    local.updated_at = new Date().toISOString();
    upsertLocalReservation(local);
  }

  const task = createDirtyTaskOnCheckout({
    reservationCode: code,
    propertyId: body.property_id ?? local?.property_id ?? null,
    roomId: body.room_id ?? local?.room_id ?? null,
  });

  const { queuePostCheckoutReviewRequest } = await import(
    "@/lib/reviews/post-checkout-request"
  );
  const review = queuePostCheckoutReviewRequest({
    reservationCode: code,
    guestName: local?.guest_name ?? "Huésped",
    guestEmail: local?.guest_email,
    checkIn: local?.check_in,
    checkOut: local?.check_out,
  });

  recordLocalAudit({
    action: "housekeeping.checkout_dirty",
    entity_type: "housekeeping_task",
    entity_id: task.id,
    actor: gate.ctx.user?.email ?? "staff",
    metadata: {
      reservation_code: code,
      property_id: task.property_id,
      review_request: review.id,
    },
  });

  return Response.json({
    ok: true,
    task,
    reservation: local,
    review_request: review,
    note: "Tarea dirty + reseña stub al checkout",
  });
}
