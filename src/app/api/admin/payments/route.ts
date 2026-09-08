import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  defaultPaymentProviderId,
  getPaymentProvider,
  listPaymentProviders,
} from "@/lib/payments/provider";
import {
  balanceForPayment,
  createLocalPendingPayment,
  listLocalPayments,
  markLocalPaymentPaid,
} from "@/lib/payments/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "pagos");
  if (mod) return mod;

  const code = new URL(req.url).searchParams.get("reservation_code")?.trim();

  const localPayments = listLocalPayments().map((p) => ({
    ...p,
    balance: balanceForPayment(p),
  }));

  const filtered = code
    ? localPayments.filter(
        (p) => p.reservation_code === code.toUpperCase(),
      )
    : localPayments;

  return Response.json({
    default_provider: defaultPaymentProviderId(),
    providers: listPaymentProviders().map((p) => ({
      id: p.id,
      displayName: p.displayName,
      isStub: p.isStub,
    })),
    payments: filtered,
    mode: "local",
    note: "Claves de pasarela solo en servidor (.env) — nunca en frontend. Lista local stub.",
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
    mark_paid?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.mark_paid && body.reservation_code) {
    const paid = markLocalPaymentPaid(body.reservation_code);
    if (!paid) {
      return Response.json(
        { error: "Pago local no encontrado para ese código" },
        { status: 404 },
      );
    }
    return Response.json({
      ok: true,
      payment: { ...paid, balance: balanceForPayment(paid) },
      note: "Marcado pagado en store local (stub)",
    });
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
  let localPayment = null;
  if (body.reservation_code) {
    localPayment = createLocalPendingPayment({
      organizationId: orgId,
      reservationId: body.reservation_id,
      reservationCode: body.reservation_code,
      amount,
      currency: body.currency ?? "COP",
      provider: provider.id,
      metadata: intent.publicMeta,
    });
  }

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
    payment: localPayment
      ? { ...localPayment, balance: balanceForPayment(localPayment) }
      : null,
    note: provider.isStub
      ? "TODO: REAL INTEGRATION REQUIRED — stub sin cobro real"
      : undefined,
  });
}
