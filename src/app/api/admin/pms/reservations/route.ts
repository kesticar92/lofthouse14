import { requireStaff } from "@/lib/api/require-staff";
import {
  findReservationConflicts,
  findBlockConflicts,
} from "@/lib/pms/conflicts";
import { regenerateCleaningTasksForReservation } from "@/lib/pms/cleaning-rpc";
import { normalizeReservationSource } from "@/lib/pms/reservation-source";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notifySupervisorsNewReservation } from "@/lib/pms/panel-notifications";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { searchParams } = new URL(req.url);
  const from =
    searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to =
    searchParams.get("to") ??
    new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
  const propertyId = searchParams.get("property_id")?.trim();

  let q = supabase
    .from("reservations")
    .select("*")
    .lt("check_in", to)
    .gt("check_out", from)
    .order("check_in");
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let bq = supabase
    .from("availability_blocks")
    .select("*")
    .lt("start_date", to)
    .gt("end_date", from)
    .order("start_date");
  if (propertyId) bq = bq.eq("property_id", propertyId);
  const { data: blocks, error: bErr } = await bq;
  if (bErr) {
    return Response.json({ error: bErr.message }, { status: 500 });
  }

  return Response.json({ reservations: data ?? [], blocks: blocks ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  let body: {
    property_id?: string;
    guest_name?: string;
    guest_phone?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
    price?: number | null;
    notes?: string;
    source?: string;
    status?: string;
    referrer_name?: string;
    commission_amount?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const property_id = body.property_id?.trim();
  const check_in = body.check_in?.trim();
  const check_out = body.check_out?.trim();
  if (!property_id || !check_in || !check_out) {
    return Response.json(
      { error: "Faltan property_id, check_in o check_out" },
      { status: 400 },
    );
  }
  if (check_out <= check_in) {
    return Response.json(
      { error: "check_out debe ser posterior a check_in (fin exclusivo)" },
      { status: 400 },
    );
  }
  const guests = Number(body.guests ?? 1);
  if (!Number.isFinite(guests) || guests < 1) {
    return Response.json({ error: "guests inválido" }, { status: 400 });
  }
  const source = normalizeReservationSource(body.source);
  const status = (body.status ?? "confirmed").trim() || "confirmed";
  if (!["confirmed", "blocked", "cancelled"].includes(status)) {
    return Response.json({ error: "status inválido" }, { status: 400 });
  }

  const referrer_name = body.referrer_name?.trim() ?? "";
  let commission_amount: number | null = null;
  if (body.commission_amount !== undefined && body.commission_amount !== null) {
    const n = Number(body.commission_amount);
    if (!Number.isFinite(n) || n < 0) {
      return Response.json(
        { error: "commission_amount inválido" },
        { status: 400 },
      );
    }
    commission_amount = n;
  }

  if (source === "referral" && !referrer_name) {
    return Response.json(
      {
        error:
          "Las reservas referidas requieren el nombre del referidor (quién recibe la comisión).",
      },
      { status: 400 },
    );
  }

  const conflicts = await findReservationConflicts(
    supabase,
    property_id,
    check_in,
    check_out,
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

  const row = {
    property_id,
    source,
    external_id: null as string | null,
    guest_name: body.guest_name?.trim() ?? "",
    guest_phone: body.guest_phone?.trim() ?? "",
    check_in,
    check_out,
    guests,
    price: body.price ?? null,
    status,
    notes: body.notes?.trim() ?? "",
    ical_summary: null as string | null,
    referrer_name: source === "referral" ? referrer_name : "",
    commission_amount: source === "referral" ? commission_amount : null,
  };

  const { data, error } = await supabase
    .from("reservations")
    .insert(row)
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (data?.id) {
    const { error: rpcErr } = await regenerateCleaningTasksForReservation(
      supabase,
      data.id,
    );
    if (rpcErr) {
      console.error("regenerateCleaningTasksForReservation", rpcErr);
    }
    if (data.status === "confirmed") {
      try {
        const admin = createServiceRoleClient();
        const { data: prop } = await admin
          .from("properties")
          .select("name")
          .eq("id", data.property_id)
          .maybeSingle();
        await notifySupervisorsNewReservation(admin, {
          propertyName: prop?.name ?? "Propiedad",
          guestName: data.guest_name ?? "",
          source: data.source ?? "",
          checkIn: data.check_in,
          checkOut: data.check_out,
        });
      } catch {
        /* sin SERVICE_ROLE_KEY */
      }
    }
  }
  return Response.json({ reservation: data });
}
