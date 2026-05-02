import { randomBytes } from "crypto";
import { requireStaff } from "@/lib/api/require-staff";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, ical_token, created_at, updated_at")
    .order("name");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ properties: data ?? [] });
}

export async function PATCH(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
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
      .select("id, ical_token")
      .maybeSingle();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ property: data });
  }
  return Response.json({ error: "Sin acción" }, { status: 400 });
}
