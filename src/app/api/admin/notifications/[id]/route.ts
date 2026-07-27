import { requireStaff } from "@/lib/api/require-staff";

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

  const { error } = await supabase
    .from("notifications")
    .update({ read: body.read ?? true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
