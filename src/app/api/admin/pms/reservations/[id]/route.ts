import { requireStaff } from "@/lib/api/require-staff";
import {
  findReservationConflicts,
  findBlockConflicts,
} from "@/lib/pms/conflicts";
import { regenerateCleaningTasksForReservation } from "@/lib/pms/cleaning-rpc";
import { normalizeReservationSource } from "@/lib/pms/reservation-source";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }

  let body: {
    property_id?: string;
    check_in?: string;
    check_out?: string;
    status?: string;
    source?: string;
    guest_name?: string;
    guest_phone?: string;
    guests?: number;
    price?: number | null;
    notes?: string;
    referrer_name?: string;
    commission_amount?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { data: cur, error: curErr } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (curErr) {
    return Response.json({ error: curErr.message }, { status: 500 });
  }
  if (!cur) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }
  if (cur.status === "cancelled") {
    return Response.json(
      { error: "La reserva está cancelada y no se puede editar." },
      { status: 400 },
    );
  }

  const wantsCalendarChange =
    body.property_id !== undefined ||
    body.check_in !== undefined ||
    body.check_out !== undefined;

  const property_id = (body.property_id ?? cur.property_id).trim();
  const check_in = (body.check_in ?? cur.check_in).trim();
  const check_out = (body.check_out ?? cur.check_out).trim();
  const nextStatus = body.status !== undefined ? body.status.trim() : cur.status;

  if (!["confirmed", "blocked", "cancelled"].includes(nextStatus)) {
    return Response.json({ error: "status inválido" }, { status: 400 });
  }

  const nextSource =
    body.source !== undefined
      ? normalizeReservationSource(body.source)
      : normalizeReservationSource(cur.source);

  const nextGuestName =
    body.guest_name !== undefined
      ? body.guest_name.trim()
      : cur.guest_name;
  const nextGuestPhone =
    body.guest_phone !== undefined
      ? body.guest_phone.trim()
      : cur.guest_phone;
  const nextGuests =
    body.guests !== undefined ? Number(body.guests) : cur.guests;
  if (
    body.guests !== undefined &&
    (!Number.isFinite(nextGuests) || nextGuests < 1)
  ) {
    return Response.json({ error: "guests inválido" }, { status: 400 });
  }
  const nextPrice =
    body.price !== undefined ? body.price : cur.price;
  const nextNotes =
    body.notes !== undefined ? body.notes.trim() : cur.notes;

  const nextReferrerRaw =
    body.referrer_name !== undefined
      ? body.referrer_name.trim()
      : (cur as { referrer_name?: string }).referrer_name ?? "";

  let nextCommission: number | null =
    (cur as { commission_amount?: number | null }).commission_amount ?? null;
  if (body.commission_amount !== undefined) {
    if (body.commission_amount === null) {
      nextCommission = null;
    } else {
      const n = Number(body.commission_amount);
      if (!Number.isFinite(n) || n < 0) {
        return Response.json(
          { error: "commission_amount inválido" },
          { status: 400 },
        );
      }
      nextCommission = n;
    }
  }

  const effectiveReferrer =
    nextSource === "referral" ? nextReferrerRaw : "";
  const effectiveCommission =
    nextSource === "referral" ? nextCommission : null;

  if (nextSource === "referral" && !effectiveReferrer) {
    return Response.json(
      {
        error:
          "Las reservas referidas requieren el nombre del referidor (quién recibe la comisión).",
      },
      { status: 400 },
    );
  }

  if (wantsCalendarChange) {
    if (check_out <= check_in) {
      return Response.json(
        { error: "check_out debe ser posterior a check_in (fin exclusivo)" },
        { status: 400 },
      );
    }

    const { data: prop, error: pErr } = await supabase
      .from("properties")
      .select("id")
      .eq("id", property_id)
      .maybeSingle();
    if (pErr || !prop) {
      return Response.json({ error: "Propiedad no válida" }, { status: 400 });
    }

    const conflicts = await findReservationConflicts(
      supabase,
      property_id,
      check_in,
      check_out,
      id,
    );
    if (conflicts.length > 0) {
      return Response.json(
        { error: "Conflicto: ya hay una reserva activa en esas fechas." },
        { status: 409 },
      );
    }
    const blockHits = await findBlockConflicts(
      supabase,
      property_id,
      check_in,
      check_out,
    );
    if (blockHits.length > 0) {
      return Response.json(
        { error: "Conflicto: las fechas coinciden con un bloqueo." },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from("reservations")
    .update({
      property_id,
      check_in,
      check_out,
      status: nextStatus,
      source: nextSource,
      guest_name: nextGuestName,
      guest_phone: nextGuestPhone,
      guests: nextGuests,
      price: nextPrice,
      notes: nextNotes,
      referrer_name: effectiveReferrer,
      commission_amount: effectiveCommission,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { error: rpcErr } = await regenerateCleaningTasksForReservation(
    supabase,
    id,
  );
  if (rpcErr) {
    console.error("regenerateCleaningTasksForReservation", rpcErr);
  }

  return Response.json({ reservation: data });
}
