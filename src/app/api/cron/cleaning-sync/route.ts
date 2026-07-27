import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { regenerateAllCleaningTasks } from "@/lib/pms/cleaning-rpc";
import { notifySupervisorsDailyCleaningDigest } from "@/lib/pms/panel-notifications";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.trim();
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await regenerateAllCleaningTasks(admin);
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
    const today = new Date().toISOString().slice(0, 10);
    await notifySupervisorsDailyCleaningDigest(admin, today);
    return Response.json({ ok: true, date: today });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
