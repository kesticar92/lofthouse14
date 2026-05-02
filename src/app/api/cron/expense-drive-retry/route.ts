import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { retryDriveBackupForExpenseFile } from "@/lib/expenses/retry-drive-backup";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.trim();
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const admin = createServiceRoleClient();
    const { data: rows, error } = await admin
      .from("expense_files")
      .select("id")
      .eq("drive_backup_status", "failed")
      .lt("drive_retry_count", 20)
      .order("created_at", { ascending: true })
      .limit(30);
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    const results: { id: string; ok: boolean; error?: string }[] = [];
    for (const row of rows ?? []) {
      const r = await retryDriveBackupForExpenseFile(admin, row.id as string);
      results.push({ id: row.id as string, ok: r.ok, error: r.error });
    }

    return Response.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
