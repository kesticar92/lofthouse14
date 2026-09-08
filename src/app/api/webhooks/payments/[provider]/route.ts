import { getPaymentProvider } from "@/lib/payments/provider";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

type Ctx = { params: Promise<{ provider: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { provider: providerId } = await ctx.params;
  const provider = getPaymentProvider(providerId);
  if (!provider) {
    return Response.json({ error: "Provider desconocido" }, { status: 404 });
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

  const result = await provider.handleWebhook({
    headers: Object.fromEntries(req.headers.entries()),
    body,
    idempotencyKey,
  });

  try {
    const admin = createServiceRoleClient();
    await admin.from("payments").insert({
      organization_id: LOFTHOUSE_ORGANIZATION_ID,
      provider: provider.id,
      amount: 0,
      status: result.status === "paid" ? "paid" : "stub",
      idempotency_key: idempotencyKey ?? null,
      metadata: { webhook: true },
      raw_webhook: body as object,
    });
  } catch {
    /* sin migración */
  }

  return Response.json({
    ok: true,
    result,
    note: provider.isStub
      ? "TODO: REAL INTEGRATION REQUIRED — no se procesó cobro real"
      : undefined,
  });
}
