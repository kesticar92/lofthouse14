import { requireStaff } from "@/lib/api/require-staff";
import { enforceOrganizationId } from "@/lib/tenant/organization";
import { buildSeedCatalog } from "@/lib/catalog/seed";
import { catalogPatchSchema } from "@/lib/catalog/schema";
import { apiBadRequest, apiErr, apiValidationError } from "@/lib/api/response";

function isMissingRelation(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("could not find the table")
  );
}

/** Catálogo SaaS: Property (edificio) + room types + rooms del tenant activo. */
export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, organizationId, profile } = gate.ctx;

  // Sin org: devolver seed solo lectura (admin local / pre-migración).
  if (!organizationId) {
    const seed = buildSeedCatalog();
    return Response.json({
      ...seed,
      read_only: true,
      note: "Sin organización activa — catálogo seed LOFTHOUSE (solo lectura).",
    });
  }

  const denied = enforceOrganizationId(organizationId);
  if (denied) return denied;

  const orgId = organizationId;

  const [orgRes, propsRes, typesRes, roomsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, slug, name, status")
      .eq("id", orgId)
      .maybeSingle(),
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

  const relationMissing =
    isMissingRelation(propsRes.error?.message) ||
    isMissingRelation(typesRes.error?.message) ||
    isMissingRelation(roomsRes.error?.message);

  if (relationMissing) {
    const seed = buildSeedCatalog();
    return Response.json({
      ...seed,
      read_only: true,
      note: "Tablas de catálogo no migradas — seed LOFTHOUSE (solo lectura).",
    });
  }

  if (propsRes.error) {
    return Response.json({ error: propsRes.error.message }, { status: 500 });
  }
  if (typesRes.error) {
    return Response.json({ error: typesRes.error.message }, { status: 500 });
  }
  if (roomsRes.error) {
    return Response.json({ error: roomsRes.error.message }, { status: 500 });
  }

  const canWrite =
    profile.role === "super_admin" ||
    profile.role === "admin" ||
    gate.ctx.orgRole === "org_admin" ||
    gate.ctx.orgRole === "property_admin";

  return Response.json({
    organization_id: orgId,
    organization: orgRes.data ?? null,
    properties: propsRes.data ?? [],
    room_types: typesRes.data ?? [],
    rooms: roomsRes.data ?? [],
    source: "database",
    read_only: !canWrite,
  });
}

/** Actualiza room_type y/o room del tenant (mínimo PATCH Fase 2). */
export async function PATCH(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, organizationId, profile, orgRole } = gate.ctx;

  const denied = enforceOrganizationId(organizationId);
  if (denied) return denied;

  const canWrite =
    profile.role === "super_admin" ||
    profile.role === "admin" ||
    orgRole === "org_admin" ||
    orgRole === "property_admin";
  if (!canWrite) {
    return apiErr("No tienes permiso para editar el catálogo", {
      status: 403,
      code: "FORBIDDEN_CATALOG_WRITE",
    });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiBadRequest("JSON inválido");
  }

  const parsed = catalogPatchSchema.safeParse(json);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten());
  }

  const orgId = organizationId!;
  const body = parsed.data;
  const now = new Date().toISOString();

  let roomTypeRow: Record<string, unknown> | null = null;
  let roomRow: Record<string, unknown> | null = null;

  if (body.room_type) {
    const { id, ...fields } = body.room_type;
    const updates: Record<string, unknown> = { updated_at: now };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.short_label !== undefined)
      updates.short_label = fields.short_label;
    if (fields.tagline !== undefined) updates.tagline = fields.tagline;
    if (fields.max_guests !== undefined) updates.max_guests = fields.max_guests;
    if (fields.sort_order !== undefined) updates.sort_order = fields.sort_order;

    if (Object.keys(updates).length === 1) {
      return apiBadRequest("Sin campos para actualizar en room_type");
    }

    const { data, error } = await supabase
      .from("room_types")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select(
        "id, organization_id, property_id, code, name, marketing_category, short_label, tagline, max_guests, sort_order, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      if (isMissingRelation(error.message)) {
        return apiErr("Catálogo no migrado en esta base de datos", {
          status: 503,
          code: "CATALOG_NOT_MIGRATED",
        });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return apiErr("Room type no encontrado", {
        status: 404,
        code: "NOT_FOUND",
      });
    }
    roomTypeRow = data;
  }

  if (body.room) {
    const { id, ...fields } = body.room;
    const updates: Record<string, unknown> = { updated_at: now };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.room_type_id !== undefined) {
      updates.room_type_id = fields.room_type_id;
    }
    if (fields.max_guests !== undefined) updates.max_guests = fields.max_guests;
    if (fields.status !== undefined) updates.status = fields.status;

    if (Object.keys(updates).length === 1) {
      return apiBadRequest("Sin campos para actualizar en room");
    }

    if (fields.room_type_id) {
      const { data: rt, error: rtErr } = await supabase
        .from("room_types")
        .select("id")
        .eq("id", fields.room_type_id)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (rtErr) {
        return Response.json({ error: rtErr.message }, { status: 500 });
      }
      if (!rt) {
        return apiBadRequest("room_type_id no pertenece a la organización");
      }
    }

    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select(
        "id, organization_id, property_id, room_type_id, code, unit_number, name, max_guests, status, legacy_property_id, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      if (isMissingRelation(error.message)) {
        return apiErr("Catálogo no migrado en esta base de datos", {
          status: 503,
          code: "CATALOG_NOT_MIGRATED",
        });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return apiErr("Room no encontrado", { status: 404, code: "NOT_FOUND" });
    }
    roomRow = data;
  }

  return Response.json({
    ok: true,
    room_type: roomTypeRow,
    room: roomRow,
  });
}
