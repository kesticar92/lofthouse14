import type { SupabaseClient } from "@supabase/supabase-js";
import { regenerateAllCleaningTasks } from "@/lib/pms/cleaning-rpc";
import { syncIcalSource } from "@/lib/pms/ical-sync";

export async function syncAllIcalSources(admin: SupabaseClient): Promise<{
  sources: number;
  results: { id: string; ok: boolean; message: string; upserted: number }[];
}> {
  const { data: sources, error } = await admin.from("ical_sources").select("id, property_id, url");
  if (error) throw new Error(error.message);
  const results: { id: string; ok: boolean; message: string; upserted: number }[] = [];
  for (const s of sources ?? []) {
    const r = await syncIcalSource(admin, s.id, s.property_id, s.url);
    results.push({
      id: s.id,
      ok: r.ok,
      message: r.message,
      upserted: r.upserted,
    });
  }
  const { error: cleanErr } = await regenerateAllCleaningTasks(admin);
  if (cleanErr) {
    console.error("regenerate_all_cleaning_tasks", cleanErr.message);
  }
  return { sources: sources?.length ?? 0, results };
}
