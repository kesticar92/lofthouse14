import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { buildPropertyIcs } from "@/lib/pms/ical-export";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!propertyId || !token) {
    return new Response("Falta token o propiedad", { status: 400 });
  }
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return new Response("Servidor no configurado", { status: 503 });
  }

  const { data: prop, error: pErr } = await admin
    .from("properties")
    .select("id, name, ical_token")
    .eq("id", propertyId)
    .maybeSingle();
  if (pErr || !prop) {
    return new Response("No encontrado", { status: 404 });
  }
  if (prop.ical_token !== token) {
    return new Response("No autorizado", { status: 401 });
  }

  const { data: reservations, error: rErr } = await admin
    .from("reservations")
    .select("*")
    .eq("property_id", propertyId)
    .order("check_in");
  if (rErr) {
    return new Response(rErr.message, { status: 500 });
  }

  const { data: blocks, error: bErr } = await admin
    .from("availability_blocks")
    .select("*")
    .eq("property_id", propertyId)
    .order("start_date");
  if (bErr) {
    return new Response(bErr.message, { status: 500 });
  }

  const ics = buildPropertyIcs({
    reservations: reservations ?? [],
    blocks: blocks ?? [],
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `inline; filename="lofthouse14-${propertyId}.ics"`,
    },
  });
}
