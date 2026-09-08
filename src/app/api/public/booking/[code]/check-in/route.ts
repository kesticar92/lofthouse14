import { saveDigitalCheckIn, getDigitalCheckIn } from "@/lib/guest/check-in-store";
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

  // Validar que la reserva exista (local o supabase)
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

  const saved = saveDigitalCheckIn({
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

  if (!saved.ok) {
    return Response.json({ error: saved.error }, { status: 400 });
  }

  // Stub: no subimos docs; opcionalmente marcar nota en reserva supabase
  try {
    const admin = createServiceRoleClient();
    await admin
      .from("reservations")
      .update({
        notes: `check-in digital ETA ${saved.checkIn.arrival_eta}`,
      })
      .eq("reservation_code", code);
  } catch {
    /* ignore */
  }

  return Response.json({
    ok: true,
    mode: "local",
    check_in: saved.checkIn,
    note: "Persistencia stub (memoria servidor + localStorage). Sin documentos sensibles.",
  });
}
