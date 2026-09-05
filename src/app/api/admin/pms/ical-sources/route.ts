import { requireStaff } from "@/lib/api/require-staff";
import { syncIcalSource } from "@/lib/pms/ical-sync";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const propertyId = new URL(req.url).searchParams.get("property_id")?.trim();
  let q = supabase
    .from("ical_sources")
    .select("id, property_id, url, last_sync, created_at, updated_at")
    .order("created_at");
  if (propertyId) q = q.eq("property_id", propertyId);
  const { data, error } = await q;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ sources: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  let body: { property_id?: string; url?: string; sync_now?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const property_id = body.property_id?.trim();
  const url = body.url?.trim();
  if (!property_id || !url) {
    return Response.json(
      { error: "Faltan property_id o url" },
      { status: 400 },
    );
  }
  let urlOk = false;
  try {
    new URL(url);
    urlOk = true;
  } catch {
    urlOk = false;
  }
  if (!urlOk) {
    return Response.json({ error: "URL iCal inválida" }, { status: 400 });
  }

  /** Varias URLs Airbnb por la misma propiedad (múltiples anuncios) → siempre nueva fila. */
  const { data: ins, error: insErr } = await supabase
    .from("ical_sources")
    .insert({ property_id, url })
    .select("*")
    .maybeSingle();
  if (insErr || !ins?.id) {
    return Response.json(
      { error: insErr?.message ?? "No se pudo crear la fuente" },
      { status: 500 },
    );
  }

  let sync: { ok: boolean; message: string; upserted: number } | null = null;
  if (body.sync_now) {
    sync = await syncIcalSource(supabase, ins.id, property_id, url);
  }

  const { data: row } = await supabase
    .from("ical_sources")
    .select("*")
    .eq("id", ins.id)
    .maybeSingle();

  return Response.json({ source: row, sync });
}
