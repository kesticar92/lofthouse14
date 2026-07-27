import { requireStaff } from "@/lib/api/require-staff";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { retryDriveBackupForExpenseFile } from "@/lib/expenses/retry-drive-backup";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ fileId: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  const { fileId } = await ctx.params;
  if (!fileId) {
    return Response.json({ error: "Falta fileId" }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const r = await retryDriveBackupForExpenseFile(admin, fileId);
    if (!r.ok) {
      return Response.json({ ok: false, error: r.error }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
