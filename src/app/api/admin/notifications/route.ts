import { requireStaff } from "@/lib/api/require-staff";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;
  const unreadOnly =
    new URL(req.url).searchParams.get("unread") === "1";

  let q = supabase
    .from("notifications")
    .select("id, title, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (unreadOnly) q = q.eq("read", false);

  const { data, error } = await q;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ notifications: data ?? [] });
}

export async function PATCH() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
