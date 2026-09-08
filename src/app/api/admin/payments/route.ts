import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  defaultPaymentProviderId,
  getPaymentProvider,
  listPaymentProviders,
} from "@/lib/payments/provider";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "pagos");
  if (mod) return mod;

  return Response.json({
    default_provider: defaultPaymentProviderId(),
    providers: listPaymentProviders().map((p) => ({
      id: p.id,
      displayName: p.displayName,
      isStub: p.isStub,
    })),
    note: "Claves de pasarela solo en servidor (.env) — nunca en frontend",
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "pagos");
  if (mod) return mod;

  let body: {
    provider?: string;
    amount?: number;
    currency?: string;
    reservation_id?: string;
    reservation_code?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const provider = getPaymentProvider(
    body.provider ?? defaultPaymentProviderId(),
  );
  if (!provider) {
    return Response.json({ error: "Provider inválido" }, { status: 400 });
  }

  const amount = Number(body.amount ?? 0);
  if (!Number.isFinite(amount) || amount < 0) {
    return Response.json({ error: "amount inválido" }, { status: 400 });
  }

  const intent = await provider.createIntent({
    amount,
    currency: body.currency ?? "COP",
    reservationId: body.reservation_id,
    reservationCode: body.reservation_code,
    idempotencyKey: `pay-${body.reservation_code ?? "x"}-${Date.now()}`,
  });

  const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;
  if (gate.ctx.organizationId) {
    await gate.ctx.supabase.from("payments").insert({
      organization_id: orgId,
      reservation_id: body.reservation_id ?? null,
      provider: provider.id,
      external_id: intent.externalId ?? null,
      amount,
      currency: body.currency ?? "COP",
      status: intent.status,
      metadata: intent.publicMeta ?? {},
    });
  }

  return Response.json({
    ok: true,
    intent,
    note: provider.isStub
      ? "TODO: REAL INTEGRATION REQUIRED — stub sin cobro real"
      : undefined,
  });
}
