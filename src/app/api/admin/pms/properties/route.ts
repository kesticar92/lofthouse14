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
    .select("id, name, ical_token, created_at, updated_at, organization_id")
    .eq("organization_id", organizationId!)
    .order("name");

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ properties: data ?? [] });
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
