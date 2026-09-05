import { requireStaff } from "@/lib/api/require-staff";
import { inclusiveRangeToExclusiveEnd } from "@/lib/pms/gaps";
import {
  findReservationConflicts,
  findBlockConflicts,
} from "@/lib/pms/conflicts";

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;
  let body: {
    property_id?: string;
    start_date?: string;
    end_date?: string;
    /** Si true, end_date es el último día bloqueado (inclusivo). Por defecto true. */
    end_inclusive?: boolean;
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const property_id = body.property_id?.trim();
  const start = body.start_date?.trim();
  const endRaw = body.end_date?.trim();
  if (!property_id || !start || !endRaw) {
    return Response.json(
      { error: "Faltan property_id, start_date o end_date" },
      { status: 400 },
    );
  }
  const endAlreadyExclusive = body.end_inclusive === false;
  const { start_date, end_date } = endAlreadyExclusive
    ? { start_date: start, end_date: endRaw }
    : inclusiveRangeToExclusiveEnd(start, endRaw);
  if (end_date <= start_date) {
    return Response.json(
      { error: "El rango de bloqueo debe tener al menos un día." },
      { status: 400 },
    );
  }

  const resHits = await findReservationConflicts(
    supabase,
    property_id,
    start_date,
    end_date,
  );
  if (resHits.length > 0) {
    return Response.json(
      { error: "No se puede bloquear: hay reservas activas en esas fechas." },
      { status: 409 },
    );
  }
  const blkHits = await findBlockConflicts(
    supabase,
    property_id,
    start_date,
    end_date,
  );
  if (blkHits.length > 0) {
    return Response.json(
      { error: "Ya existe un bloqueo que se solapa con el rango." },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("availability_blocks")
    .insert({
      property_id,
      start_date,
      end_date,
      reason: body.reason?.trim() ?? "",
      created_by: user.id,
    })
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ block: data });
}
