import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { getChannelAdapter } from "@/lib/channels/adapter";
import { importChannelReservation } from "@/lib/channels/import-reservation";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "canales");
  if (denied) return denied;

  let body: {
    channel?: string;
    action?: "push" | "pull" | "webhook" | "import_reservation";
    check_in?: string;
    check_out?: string;
    guest_name?: string;
    guests?: number;
    price?: number;
    category_id?: "vista" | "atrio" | "cielo";
    idempotency_key?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const channel = body.channel ?? "airbnb";
  const adapter = getChannelAdapter(channel);
  if (!adapter) {
    return Response.json({ error: "Canal desconocido" }, { status: 400 });
  }

  const action = body.action ?? "pull";

  if (action === "import_reservation") {
    const checkIn =
      body.check_in ??
      new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const checkOut =
      body.check_out ??
      new Date(Date.now() + 17 * 86400000).toISOString().slice(0, 10);

    const imported = importChannelReservation({
      channel: adapter.id,
      guestName: body.guest_name,
      checkIn,
      checkOut,
      guests: body.guests ?? 2,
      price: body.price ?? 180_000,
      categoryId: body.category_id ?? "vista",
      externalId: body.idempotency_key ?? `sim-import-${Date.now()}`,
    });

    const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;
    try {
      await gate.ctx.supabase.from("channel_sync_logs").insert({
        organization_id: orgId,
        channel: adapter.id,
        direction: "inbound",
        event_type: "simulate_import_reservation",
        idempotency_key: body.idempotency_key ?? null,
        payload: imported,
        status: imported.ok ? "simulated" : "error",
        message: imported.ok
          ? `Imported ${imported.reservation.reservation_code}`
          : imported.error,
      });
    } catch {
      /* tabla puede no existir */
    }

    if (!imported.ok) {
      return Response.json(
        { ok: false, error: imported.error, code: imported.code },
        { status: 409 },
      );
    }

    return Response.json({
      ok: true,
      result: {
        ok: true,
        channel: adapter.id,
        status: "simulated",
        message: `Reserva ${imported.reservation.reservation_code} importada (stub)`,
        payload: {
          reservation_code: imported.reservation.reservation_code,
          payment_id: imported.payment.id,
        },
      },
      reservation: imported.reservation,
      payment: imported.payment,
      note: "STUB — TODO: REAL INTEGRATION REQUIRED para OTA real",
    });
  }

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
