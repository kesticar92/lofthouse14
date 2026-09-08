import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("reservations")
      .select(
        "id, reservation_code, guest_name, guest_email, guest_phone, check_in, check_out, guests, price, status, payment_status, extras, source, channel, created_at",
      )
      .eq("reservation_code", code)
      .maybeSingle();
    if (data) {
      return Response.json({ mode: "supabase", reservation: data });
    }
  } catch {
    /* local */
  }

  const local = lookupLocalBooking(code);
  if (!local) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  return Response.json({
    mode: "local",
    note: "Mock local — no persiste entre reinicios",
    reservation: local,
  });
}
