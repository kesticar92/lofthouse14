import { getPaymentProvider } from "@/lib/payments/provider";
import {
  getWebhookIdempotency,
  setWebhookIdempotency,
} from "@/lib/payments/webhook-idempotency";
import {
  getLocalPaymentByCode,
  markLocalPaymentPaid,
} from "@/lib/payments/local-store";
import {
  ensureFolioForReservation,
  registerFolioPayment,
} from "@/lib/folio/store";
import { getLocalReservationByCode, upsertLocalReservation } from "@/lib/availability/local-store";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { runAutomation } from "@/lib/crm/automation-runner";

type Ctx = { params: Promise<{ provider: string }> };

function extractReservationCode(body: unknown): string | null {
  const b = body as {
    reservation_code?: string;
    data?: {
      transaction?: { reference?: string; customer_email?: string };
    };
    reference?: string;
    publicMeta?: { reservationCode?: string };
  };
  if (b?.reservation_code) return b.reservation_code.trim().toUpperCase();
  const ref = b?.data?.transaction?.reference || b?.reference;
  if (typeof ref === "string") {
    const m = ref.match(/LH-[A-Z0-9]+/i);
    if (m) return m[0].toUpperCase();
  }
  return null;
}

export async function POST(req: Request, ctx: Ctx) {
  const { provider: providerId } = await ctx.params;
  const provider = getPaymentProvider(providerId);
  if (!provider) {
    return Response.json({ error: "Provider desconocido" }, { status: 404 });
  }

  const idempotencyKey =
    req.headers.get("idempotency-key") ||
    req.headers.get("x-idempotency-key") ||
    req.headers.get("x-event-id") ||
    undefined;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Idempotencia: misma key → misma respuesta, sin doble cobro/folio
  if (idempotencyKey) {
    const existing = getWebhookIdempotency(provider.id, idempotencyKey);
    if (existing) {
      return Response.json({
        ok: true,
        idempotent: true,
        result: existing.result,
        note: "Webhook ya procesado (idempotency)",
      });
    }
  }

  const result = await provider.handleWebhook({
    headers: Object.fromEntries(req.headers.entries()),
    body,
    idempotencyKey,
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.message, result },
      { status: 400 },
    );
  }

  const code = extractReservationCode(body);
  let paymentUpdated = null;
  let folioUpdated = null;

  if (result.status === "paid" && code) {
    paymentUpdated = markLocalPaymentPaid(code);
    const res = getLocalReservationByCode(code);
    if (res) {
      res.payment_status = "paid";
      upsertLocalReservation(res);
      ensureFolioForReservation(res);
      const localPay = getLocalPaymentByCode(code);
      folioUpdated = registerFolioPayment(code, {
        amount: localPay?.amount_paid ?? localPay?.amount ?? res.price ?? 0,
        method: "card_stub",
        notes: `Webhook ${provider.id} · ${result.externalId ?? "n/a"}`,
      });
      runAutomation({
        eventType: "payment_received",
        payload: {
          reservation_code: code,
          guest_name: res.guest_name,
          provider: provider.id,
        },
      });
    }
  }

  if (idempotencyKey) {
    setWebhookIdempotency({
      provider: provider.id,
      key: idempotencyKey,
      status: result.status,
      result: result as unknown as Record<string, unknown>,
    });
  }

  try {
    const admin = createServiceRoleClient();
    await admin.from("payments").insert({
      organization_id: LOFTHOUSE_ORGANIZATION_ID,
      provider: provider.id,
      amount: 0,
      status: result.status === "paid" ? "paid" : result.status,
      idempotency_key: idempotencyKey ?? null,
      external_id: result.externalId ?? null,
      metadata: { webhook: true, reservation_code: code },
      raw_webhook: body as object,
    });
  } catch {
    /* sin migración / sin env */
  }

  return Response.json({
    ok: true,
    result,
    payment: paymentUpdated,
    folio: folioUpdated,
    note: provider.isStub
      ? "TODO: REAL INTEGRATION REQUIRED — webhook mock / sin cobro real"
      : undefined,
  });
}
