import { requireStaff } from "@/lib/api/require-staff";
import { enforceOrganizationId } from "@/lib/tenant/organization";

/** Catálogo SaaS: Property (edificio) + room types + rooms del tenant activo. */
export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, organizationId } = gate.ctx;
  const denied = enforceOrganizationId(organizationId);
  if (denied) return denied;

  const orgId = organizationId!;

  const [propsRes, typesRes, roomsRes] = await Promise.all([
    supabase
      .from("org_properties")
      .select(
        "id, organization_id, name, slug, timezone, address, city, country, status, created_at, updated_at",
      )
      .eq("organization_id", orgId)
      .order("name"),
    supabase
      .from("room_types")
      .select(
        "id, organization_id, property_id, code, name, marketing_category, short_label, tagline, max_guests, sort_order, created_at, updated_at",
      )
      .eq("organization_id", orgId)
      .order("sort_order"),
    supabase
      .from("rooms")
      .select(
        "id, organization_id, property_id, room_type_id, code, unit_number, name, max_guests, status, legacy_property_id, created_at, updated_at",
      )
      .eq("organization_id", orgId)
      .order("unit_number", { ascending: true, nullsFirst: false }),
  ]);

  if (propsRes.error) {
    return Response.json({ error: propsRes.error.message }, { status: 500 });
  }
  if (typesRes.error) {
    return Response.json({ error: typesRes.error.message }, { status: 500 });
  }
  if (roomsRes.error) {
    return Response.json({ error: roomsRes.error.message }, { status: 500 });
  }

  return Response.json({
    organization_id: orgId,
    properties: propsRes.data ?? [],
    room_types: typesRes.data ?? [],
    rooms: roomsRes.data ?? [],
  });
}
