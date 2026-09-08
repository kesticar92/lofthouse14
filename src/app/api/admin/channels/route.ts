import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { listChannelAdapters } from "@/lib/channels/adapter";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "canales");
  if (denied) return denied;

  const adapters = listChannelAdapters().map((a) => ({
    id: a.id,
    displayName: a.displayName,
    isStub: a.isStub,
  }));

  const { supabase, organizationId } = gate.ctx;
  let connections: unknown[] = [];
  let logs: unknown[] = [];

  if (organizationId) {
    const { data: conns } = await supabase
      .from("channel_connections")
      .select("*")
      .eq("organization_id", organizationId);
    connections = conns ?? [];

    const { data: syncLogs } = await supabase
      .from("channel_sync_logs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);
    logs = syncLogs ?? [];
  }

  return Response.json({
    organization_id: organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
    adapters,
    connections,
    logs,
    note:
      connections.length === 0
        ? "Sin filas channel_connections — aplicar migración 024 o usar simulador"
        : undefined,
  });
}
