import { requireStaff } from "@/lib/api/require-staff";
import { syncIcalSource } from "@/lib/pms/ical-sync";

export async function POST(
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
  const { data: src, error: selErr } = await supabase
    .from("ical_sources")
    .select("id, property_id, url")
    .eq("id", id)
    .maybeSingle();
  if (selErr) {
    return Response.json({ error: selErr.message }, { status: 500 });
  }
  if (!src) {
    return Response.json({ error: "Fuente no encontrada" }, { status: 404 });
  }
  const out = await syncIcalSource(supabase, src.id, src.property_id, src.url);
  return Response.json(out);
}
