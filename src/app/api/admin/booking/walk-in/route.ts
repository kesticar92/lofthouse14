import { z } from "zod";
import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { createLocalBooking } from "@/lib/booking/create-reservation";
import { unifiedQuote, SEED_RATE_PLANS } from "@/lib/pricing/unified";
import { ensureFolioForReservation } from "@/lib/folio/store";
import { runAutomation } from "@/lib/crm/automation-runner";
import { normalizeBookingChannel } from "@/lib/booking/channels";

const schema = z.object({
  check_in: z.string().min(8),
  check_out: z.string().min(8),
  guests: z.number().int().min(1).max(20).default(2),
  lofts: z.number().int().min(1).max(14).default(1),
  guest_name: z.string().min(1).max(200),
  guest_phone: z.string().max(40).optional(),
  guest_email: z.string().email().optional().or(z.literal("")),
  category_id: z.enum(["vista", "atrio", "cielo"]).optional(),
  notes: z.string().max(2000).optional(),
  price: z.number().nonnegative().nullable().optional(),
  walk_in: z.boolean().default(true),
  channel: z.string().max(40).optional(),
  corporate_name: z.string().max(200).optional(),
  referrer_name: z.string().max(200).optional(),
});

/** Walk-in / grupo ligero vía motor local de booking. */
export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "reservas");
  if (mod) return mod;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Payload inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  let price = body.price ?? null;
  if (price == null) {
    const q = unifiedQuote({
      input: {
        checkIn: body.check_in,
        checkOut: body.check_out,
        huespedes: body.guests,
        lofts: body.lofts,
      },
      plans: SEED_RATE_PLANS,
      categoryId: body.category_id,
      publicMode: false,
    });
    price = q.ok ? q.totalReserva : null;
  }

  const channel = body.walk_in
    ? "walk_in"
    : normalizeBookingChannel(body.channel, "direct");

  const result = createLocalBooking({
    checkIn: body.check_in,
    checkOut: body.check_out,
    guests: body.guests,
    lofts: body.lofts,
    guestName: body.guest_name,
    guestPhone: body.guest_phone,
    guestEmail: body.guest_email,
    categoryId: body.category_id,
    price,
    notes: body.notes,
    walkIn: body.walk_in,
    source: body.walk_in ? "walk_in" : channel,
    channel,
    corporateName: body.corporate_name,
    referrerName: body.referrer_name,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, code: result.code },
      { status: 409 },
    );
  }

  ensureFolioForReservation(result.reservation);
  const automation = runAutomation({
    eventType: "booking_created",
    payload: {
      reservation_code: result.reservation.reservation_code,
      guest_name: result.reservation.guest_name,
      check_in: result.reservation.check_in,
      check_out: result.reservation.check_out,
      total: result.reservation.price ?? "",
    },
  });

  return Response.json({
    ok: true,
    mode: result.mode,
    reservation: result.reservation,
    payment: result.payment ?? null,
    automation,
    note:
      body.lofts > 1
        ? `Grupo ligero: ${body.lofts} unidades asignadas (local).`
        : body.walk_in
          ? "Walk-in creado en motor local."
          : "Reserva admin creada.",
  });
}
