import { requireStaff } from "@/lib/api/require-staff";
import { syncAllIcalSources } from "@/lib/pms/run-sync-all";

export async function POST() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  try {
    const out = await syncAllIcalSources(supabase);
    return Response.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
