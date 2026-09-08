import { getChannelAdapter } from "@/lib/channels/adapter";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Ctx = { params: Promise<{ channel: string }> };

/**
 * Webhook OTA stub (Fase 7).
 * Valida idempotency_key placeholder; no integra APIs reales.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { channel } = await ctx.params;
  const adapter = getChannelAdapter(channel);
  if (!adapter) {
    return Response.json({ error: "Canal desconocido" }, { status: 404 });
  }

  const idempotencyKey =
    req.headers.get("idempotency-key") ||
    req.headers.get("x-idempotency-key") ||
    undefined;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Placeholder signature validation
  const signature = req.headers.get("x-channel-signature");
  if (signature === "invalid") {
    return Response.json({ error: "Firma inválida (placeholder)" }, { status: 401 });
  }

  const result = await adapter.handleWebhook({
    headers: Object.fromEntries(req.headers.entries()),
    body,
    idempotencyKey,
  });

  try {
    const admin = createServiceRoleClient();
    if (idempotencyKey) {
      const { data: existing } = await admin
        .from("channel_sync_logs")
        .select("id")
        .eq("organization_id", LOFTHOUSE_ORGANIZATION_ID)
        .eq("channel", adapter.id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existing) {
        return Response.json({
          ok: true,
          deduplicated: true,
          result,
          note: "Idempotency hit",
        });
      }
    }
    await admin.from("channel_sync_logs").insert({
      organization_id: LOFTHOUSE_ORGANIZATION_ID,
      channel: adapter.id,
      direction: "inbound",
      event_type: "webhook",
      idempotency_key: idempotencyKey ?? null,
      payload: { body, result },
      status: result.status,
      message: result.message,
    });
  } catch {
    /* sin DB */
  }

  return Response.json({
    ok: true,
    result,
    note: "TODO: REAL INTEGRATION REQUIRED",
  });
}
