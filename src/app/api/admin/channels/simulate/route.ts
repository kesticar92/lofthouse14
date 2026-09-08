import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { getChannelAdapter } from "@/lib/channels/adapter";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "canales");
  if (denied) return denied;

  let body: {
    channel?: string;
    action?: "push" | "pull" | "webhook";
    check_in?: string;
    check_out?: string;
    idempotency_key?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const adapter = getChannelAdapter(body.channel ?? "airbnb");
  if (!adapter) {
    return Response.json({ error: "Canal desconocido" }, { status: 400 });
  }

  const action = body.action ?? "pull";
  let result;
  if (action === "push") {
    result = await adapter.pushAvailability({
      checkIn: body.check_in ?? "2026-09-01",
      checkOut: body.check_out ?? "2026-09-07",
      available: 1,
    });
  } else if (action === "webhook") {
    result = await adapter.handleWebhook({
      headers: {},
      body: { simulated: true },
      idempotencyKey: body.idempotency_key ?? `sim-${Date.now()}`,
    });
  } else {
    result = await adapter.pullReservations();
  }

  const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;
  try {
    await gate.ctx.supabase.from("channel_sync_logs").insert({
      organization_id: orgId,
      channel: adapter.id,
      direction: action === "push" ? "outbound" : "inbound",
      event_type: `simulate_${action}`,
      idempotency_key: body.idempotency_key ?? null,
      payload: result,
      status: result.status,
      message: result.message,
    });
  } catch {
    /* tabla puede no existir */
  }

  return Response.json({
    ok: true,
    result,
    note: adapter.isStub
      ? "STUB — TODO: REAL INTEGRATION REQUIRED"
      : undefined,
  });
}
