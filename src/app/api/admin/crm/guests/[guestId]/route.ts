import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { listLocalReservations } from "@/lib/availability/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

type Ctx = { params: Promise<{ guestId: string }> };

function guestKey(r: {
  guest_email: string;
  guest_phone: string;
  guest_name: string;
}) {
  return r.guest_email || r.guest_phone || r.guest_name;
}

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  const { guestId: raw } = await ctx.params;
  const guestId = decodeURIComponent(raw ?? "").trim();
  if (!guestId) {
    return Response.json({ error: "guestId requerido" }, { status: 400 });
  }

  const { supabase, organizationId } = gate.ctx;
  if (organizationId) {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", guestId)
      .maybeSingle();
    if (!error && data) {
      const { data: stays } = await supabase
        .from("reservations")
        .select(
          "reservation_code, check_in, check_out, status, payment_status, price, source, guest_email, guest_phone, guest_name",
        )
        .eq("organization_id", organizationId)
        .or(
          [
            data.email ? `guest_email.eq.${data.email}` : null,
            data.phone ? `guest_phone.eq.${data.phone}` : null,
            data.full_name ? `guest_name.eq.${data.full_name}` : null,
          ]
            .filter(Boolean)
            .join(",") || `guest_name.eq.${data.full_name ?? ""}`,
        )
        .order("check_in", { ascending: false })
        .limit(50);

      return Response.json({
        mode: "supabase",
        guest: data,
        stays: stays ?? [],
      });
    }
  }

  const locals = listLocalReservations().filter(
    (r) => guestKey(r) === guestId || r.reservation_code === guestId,
  );
  if (locals.length === 0) {
    return Response.json({ error: "Huésped no encontrado" }, { status: 404 });
  }

  const first = locals[0]!;
  return Response.json({
    mode: "local",
    organization_id: organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
    guest: {
      id: guestId,
      full_name: first.guest_name,
      email: first.guest_email,
      phone: first.guest_phone,
      notes: "",
    },
    stays: locals.map((r) => ({
      reservation_code: r.reservation_code,
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      payment_status: r.payment_status,
      price: r.price,
      source: r.source,
    })),
    note: "Ficha derivada de reservas locales / aplicar 026",
  });
}
