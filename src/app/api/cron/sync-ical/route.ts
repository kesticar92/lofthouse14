import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { syncAllIcalSources } from "@/lib/pms/run-sync-all";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.trim();
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const admin = createServiceRoleClient();
    const out = await syncAllIcalSources(admin);
    return Response.json({ ok: true, ...out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
