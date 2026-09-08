import { requireStaff } from "@/lib/api/require-staff";
import {
  listLocalOpsNotifications,
  markAllLocalOpsNotificationsRead,
} from "@/lib/ops/local-notifications";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;
  const unreadOnly = new URL(req.url).searchParams.get("unread") === "1";

  let remote: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    href?: string;
    level?: string;
    source?: string;
  }> = [];

  try {
    let q = supabase
      .from("notifications")
      .select("id, title, message, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (unreadOnly) q = q.eq("read", false);
    const { data, error } = await q;
    if (!error && data) {
      remote = data.map((n) => ({
        ...n,
        source: "supabase",
      }));
    }
  } catch {
    /* local fallback */
  }

  const local = listLocalOpsNotifications({ unreadOnly }).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    read: n.read,
    created_at: n.created_at,
    href: n.href,
    level: n.level,
    source: n.source,
  }));

  const merged = [...remote, ...local].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  return Response.json({
    notifications: merged.slice(0, 80),
    sources: { supabase: remote.length, local: local.length },
  });
}

export async function PATCH() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;

  let supabaseOk = false;
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    supabaseOk = !error;
  } catch {
    supabaseOk = false;
  }

  const localMarked = markAllLocalOpsNotificationsRead();
  return Response.json({
    ok: true,
    supabase: supabaseOk,
    local_marked: localMarked,
  });
}
