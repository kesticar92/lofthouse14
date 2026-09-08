import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  defaultPaymentProviderId,
  getPaymentProvider,
  listPaymentProviders,
} from "@/lib/payments/provider";
import {
  balanceForPayment,
  createLocalPendingPayment,
  getLocalPaymentByCode,
  listLocalPayments,
  markLocalPaymentPaid,
} from "@/lib/payments/local-store";
import {
  ensureFolioForReservation,
  registerFolioPayment,
  settleFolioBalance,
  computeFolioBalance,
} from "@/lib/folio/store";
import {
  getLocalReservationByCode,
  upsertLocalReservation,
} from "@/lib/availability/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { runAutomation } from "@/lib/crm/automation-runner";

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
    simulate_wompi?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  /** Simular pago Wompi (mock) → marca paid + actualiza folio/reserva */
  if (body.simulate_wompi && body.reservation_code) {
    const code = body.reservation_code.trim().toUpperCase();
    let payment = getLocalPaymentByCode(code);
    if (!payment) {
      const amount = Number(body.amount ?? 0);
      payment = createLocalPendingPayment({
        organizationId: gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
        reservationCode: code,
        amount: amount > 0 ? amount : 100_000,
        provider: "wompi",
        metadata: { simulated: true },
      });
    }
    const paid = markLocalPaymentPaid(code);
    const res = getLocalReservationByCode(code);
    if (res) {
      res.payment_status = "paid";
      upsertLocalReservation(res);
      ensureFolioForReservation(res);
      registerFolioPayment(code, {
        amount: paid?.amount_paid ?? payment.amount,
        method: "card_stub",
        notes: "Simular pago Wompi (mock admin)",
      });
    }
    runAutomation({
      eventType: "payment_received",
      payload: {
        reservation_code: code,
        guest_name: res?.guest_name ?? "",
        provider: "wompi",
        simulated: true,
      },
    });
    return Response.json({
      ok: true,
      simulated: true,
      payment: paid
        ? { ...paid, balance: balanceForPayment(paid) }
        : null,
      folio: res
        ? {
            ...ensureFolioForReservation(res),
            balance: computeFolioBalance(ensureFolioForReservation(res)),
          }
        : null,
      note: "Simulación Wompi mock — sin cobro real. TODO: REAL INTEGRATION REQUIRED.",
    });
  }

  if (body.mark_paid && body.reservation_code) {
    const code = body.reservation_code.trim().toUpperCase();
    const paid = markLocalPaymentPaid(code);
    if (!paid) {
      return Response.json(
        { error: "Pago local no encontrado para ese código" },
        { status: 404 },
      );
    }
    const res = getLocalReservationByCode(code);
    if (res) {
      res.payment_status = "paid";
      upsertLocalReservation(res);
      ensureFolioForReservation(res);
      settleFolioBalance(code);
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
