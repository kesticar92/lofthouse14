// Ruta legacy sin apiHandler (POST simple); auth vía requireStaff + enforceStaffModule.
import { apiBadRequest, apiErr, apiOk } from "@/lib/api/response";
import { enforceStaffModule, requireStaff } from "@/lib/api/require-staff";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { retryDriveBackupForExpenseFile } from "@/lib/expenses/retry-drive-backup";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ fileId: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "gastos");
  if (denied) return denied;

  const { fileId } = await ctx.params;
  if (!fileId) {
    return apiBadRequest("Falta fileId");
  }

  try {
    const admin = createServiceRoleClient();
    const r = await retryDriveBackupForExpenseFile(admin, fileId);
    if (!r.ok) {
      return apiErr(r.error ?? "Error al reintentar respaldo en Drive", {
        status: 400,
        code: "DRIVE_RETRY_FAILED",
      });
    }
    return apiOk({ retried: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return apiErr(msg, { status: 500 });
  }
}
