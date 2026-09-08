import { persistDigitalCheckIn } from "@/lib/guest/persist-check-in";
import { getDigitalCheckIn } from "@/lib/guest/check-in-store";
import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }
  const checkIn = getDigitalCheckIn(code);
  if (!checkIn) {
    return Response.json({ check_in: null });
  }
  return Response.json({ check_in: checkIn });
}

export async function POST(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  let body: {
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
    guests?: number;
    arrival_eta?: string;
    terms_accepted?: boolean;
    data_confirmed?: boolean;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  let exists = Boolean(lookupLocalBooking(code));
  if (!exists) {
    try {
      const admin = createServiceRoleClient();
      const { data } = await admin
        .from("reservations")
        .select("reservation_code")
        .eq("reservation_code", code)
        .maybeSingle();
      exists = Boolean(data);
    } catch {
      /* local only */
    }
  }
  if (!exists) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const persisted = await persistDigitalCheckIn({
    reservation_code: code,
    guest_name: body.guest_name ?? "",
    guest_phone: body.guest_phone,
    guest_email: body.guest_email,
    guests: Math.max(1, Math.floor(body.guests ?? 1)),
    arrival_eta: body.arrival_eta ?? "",
    terms_accepted: Boolean(body.terms_accepted),
    data_confirmed: Boolean(body.data_confirmed),
    notes: body.notes,
    completed_at: new Date().toISOString(),
  });

  if (!persisted.ok) {
    return Response.json({ error: persisted.error }, { status: 400 });
  }

  return Response.json({
    ok: true,
    mode: persisted.mode,
    check_in: persisted.checkIn,
    staff_notification: persisted.staffNotification,
    note:
      persisted.mode === "local"
        ? "Persistencia local + notificación staff stub. Con SUPABASE_SERVICE_ROLE_KEY se actualiza reservations."
        : "Persistido en Supabase (reservations) + notificación staff.",
  });
}
