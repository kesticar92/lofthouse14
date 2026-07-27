import { requireStaff } from "@/lib/api/require-staff";

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
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const url = body.url?.trim();
  if (!url) {
    return Response.json({ error: "Falta url" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "URL iCal inválida" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("ical_sources")
    .update({ url, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Fuente no encontrada" }, { status: 404 });
  }
  return Response.json({ source: data });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }
  const { error } = await supabase.from("ical_sources").delete().eq("id", id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
