import { randomBytes } from "crypto";
import { requireStaff } from "@/lib/api/require-staff";
import { enforceOrganizationId } from "@/lib/tenant/organization";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, organizationId } = gate.ctx;
  const denied = enforceOrganizationId(organizationId);
  if (denied) return denied;

  let query = supabase
    .from("properties")
    .select(
      "id, name, ical_token, created_at, updated_at, organization_id, room_id",
    )
    .eq("organization_id", organizationId!)
    .order("name");

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const properties = data ?? [];
  const roomIds = properties
    .map((p) => p.room_id)
    .filter((id): id is string => Boolean(id));

  let statusByRoom = new Map<string, string>();
  if (roomIds.length > 0) {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, status")
      .in("id", roomIds);
    statusByRoom = new Map((rooms ?? []).map((r) => [r.id, r.status]));
  }

  // Fallback: bridge por legacy_property_id si room_id aún no está poblado
  const missing = properties.filter((p) => !p.room_id).map((p) => p.id);
  if (missing.length > 0) {
    const { data: roomsByLegacy } = await supabase
      .from("rooms")
      .select("id, status, legacy_property_id")
      .in("legacy_property_id", missing);
    for (const r of roomsByLegacy ?? []) {
      if (r.legacy_property_id) {
        statusByRoom.set(r.legacy_property_id, r.status);
      }
    }
  }

  const enriched = properties.map((p) => ({
    ...p,
    unit_status: p.room_id
      ? (statusByRoom.get(p.room_id) ?? null)
      : (statusByRoom.get(p.id) ?? null),
  }));

  return Response.json({ properties: enriched });
}

export async function PATCH(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, organizationId } = gate.ctx;
  const denied = enforceOrganizationId(organizationId);
  if (denied) return denied;

  let body: { id?: string; regenerate_ical_token?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id) {
    return Response.json({ error: "Falta id de propiedad" }, { status: 400 });
  }
  if (body.regenerate_ical_token) {
    const token = randomBytes(24).toString("hex");
    const { data, error } = await supabase
      .from("properties")
      .update({ ical_token: token, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organizationId!)
      .select("id, ical_token")
      .maybeSingle();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ property: data });
  }
  return Response.json({ error: "Sin acción" }, { status: 400 });
}
