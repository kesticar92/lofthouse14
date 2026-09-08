import { requireStaff } from "@/lib/api/require-staff";
import { markLocalOpsNotificationRead } from "@/lib/ops/local-notifications";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }

  let body: { read?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const wantRead = body.read ?? true;
  let supabaseHit = false;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: wantRead })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    supabaseHit = !error && Boolean(data);
  } catch {
    supabaseHit = false;
  }

  const localHit = wantRead ? markLocalOpsNotificationRead(id) : false;
  if (!supabaseHit && !localHit) {
    return Response.json({ error: "Notificación no encontrada" }, { status: 404 });
  }

  return Response.json({ ok: true, supabase: supabaseHit, local: localHit });
}
