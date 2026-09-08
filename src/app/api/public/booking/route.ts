import { z } from "zod";
import {
  createLocalBooking,
  lookupLocalBooking,
} from "@/lib/booking/create-reservation";
import { generateReservationCode } from "@/lib/booking/reservation-code";
import {
  findAvailableUnits,
  wouldDoubleBook,
} from "@/lib/availability/engine";
import {
  intervalsFromDbRows,
  unitsFromCatalogRows,
} from "@/lib/booking/create-reservation";
import { ROOM_TYPE_IDS } from "@/lib/catalog/seed";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runAutomation } from "@/lib/crm/automation-runner";
import { unifiedQuote, SEED_RATE_PLANS } from "@/lib/pricing/unified";
import { validateCoupon } from "@/lib/promotions/coupons";
import { ensureFolioForReservation } from "@/lib/folio/store";
import { normalizeClientExtras } from "@/lib/booking/extras-catalog";
import { normalizeBookingChannel } from "@/lib/booking/channels";

const bodySchema = z.object({
  check_in: z.string().min(8),
  check_out: z.string().min(8),
  guests: z.number().int().min(1).max(20).default(1),
  lofts: z.number().int().min(1).max(14).optional(),
  guest_name: z.string().min(1).max(200),
  guest_phone: z.string().max(40).optional(),
  guest_email: z.string().email().optional().or(z.literal("")),
  category_id: z.enum(["vista", "atrio", "cielo"]).optional(),
  extras: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        amountCop: z.number().optional(),
      }),
    )
    .optional(),
  notes: z.string().max(2000).optional(),
  pending: z.boolean().optional(),
  coupon_code: z.string().max(40).optional(),
  /** Si true, también sugiere abrir WhatsApp (coexistencia) */
  also_whatsapp: z.boolean().optional(),
  channel: z.string().max(40).optional(),
  corporate_name: z.string().max(200).optional(),
  referrer_name: z.string().max(200).optional(),
  source: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Payload inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const quoteResult = unifiedQuote({
    input: {
      checkIn: body.check_in,
      checkOut: body.check_out,
      huespedes: body.guests,
      lofts: body.lofts ?? 1,
    },
    plans: SEED_RATE_PLANS,
    categoryId: body.category_id,
    publicMode: true,
  });
  const nights = quoteResult.ok ? quoteResult.noches : undefined;
  const extrasQuoted = normalizeClientExtras(body.extras, {
    guests: body.guests,
    nights: nights ?? 1,
  });
  const extrasPayload = extrasQuoted.lines.map((l) => ({
    id: l.id,
    label: l.label,
    amountCop: l.amountCop,
  }));
  const channel = normalizeBookingChannel(body.channel, "direct");

  let price = quoteResult.ok
    ? quoteResult.totalReserva + extrasQuoted.totalCop
    : null;
  let couponApplied: {
    code: string;
    discount: number;
    total_after: number;
  } | null = null;
  if (price != null && body.coupon_code?.trim()) {
    const validated = validateCoupon({
      code: body.coupon_code,
      subtotal: price,
      nights,
    });
    if (validated.ok) {
      couponApplied = {
        code: validated.coupon.code,
        discount: validated.discount,
        total_after: validated.total_after,
      };
      price = Math.max(0, validated.total_after);
    }
  }

  // Prefer Supabase si está disponible
  try {
    const admin = createServiceRoleClient();
    const orgId = LOFTHOUSE_ORGANIZATION_ID;
    const roomTypeId = body.category_id
      ? ROOM_TYPE_IDS[body.category_id]
      : null;

    const { data: rooms } = await admin
      .from("rooms")
      .select("id, room_type_id, legacy_property_id, code, status, max_guests")
      .eq("organization_id", orgId);

    if (rooms && rooms.length > 0) {
      const propertyIds = rooms
        .map((r) => r.legacy_property_id)
        .filter(Boolean) as string[];

      const { data: reservations } = await admin
        .from("reservations")
        .select("id, property_id, check_in, check_out, status")
        .in(
          "property_id",
          propertyIds.length
            ? propertyIds
            : ["00000000-0000-0000-0000-000000000000"],
        )
        .neq("status", "cancelled");

      const { data: blocks } = await admin
        .from("availability_blocks")
        .select("id, property_id, start_date, end_date")
        .in(
          "property_id",
          propertyIds.length
            ? propertyIds
            : ["00000000-0000-0000-0000-000000000000"],
        );

      let holds: Array<{
        id: string;
        property_id: string;
        check_in: string;
        check_out: string;
        status: string;
        expires_at: string;
      }> = [];
      try {
        const { data: holdRows } = await admin
          .from("availability_holds")
          .select("id, property_id, check_in, check_out, status, expires_at")
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString());
        holds = holdRows ?? [];
      } catch {
        /* tabla 021 puede no existir */
      }

      const units = unitsFromCatalogRows(rooms);
      const intervals = intervalsFromDbRows({
        reservations: reservations ?? [],
        blocks: blocks ?? [],
        holds,
      });

      const available = findAvailableUnits({
        units,
        intervals,
        checkIn: body.check_in,
        checkOut: body.check_out,
        roomTypeId,
        guests: body.guests,
      });

      if (available.length === 0) {
        return Response.json(
          { error: "Sin disponibilidad", code: "NO_AVAILABILITY" },
          { status: 409 },
        );
      }

      const unit = available[0]!;
      if (
        wouldDoubleBook(
          unit.propertyId,
          body.check_in,
          body.check_out,
          intervals,
          unit,
        )
      ) {
        return Response.json(
          { error: "Double booking", code: "DOUBLE_BOOKING" },
          { status: 409 },
        );
      }

      const code = generateReservationCode("LH");
      const row = {
        organization_id: orgId,
        property_id: unit.propertyId,
        room_id: unit.roomId,
        room_type_id: roomTypeId,
        reservation_code: code,
        guest_name: body.guest_name,
        guest_phone: body.guest_phone ?? "",
        guest_email: body.guest_email ?? "",
        check_in: body.check_in,
        check_out: body.check_out,
        guests: body.guests,
        price,
        status: body.pending ? "pending" : "confirmed",
        payment_status: "unpaid",
        extras: extrasPayload,
        source: body.source ?? "lofthouse14.com",
        channel,
        notes: body.notes ?? "",
      };

      const { data, error } = await admin
        .from("reservations")
        .insert(row)
        .select("*")
        .maybeSingle();

      if (error) {
        // Columnas Fase 4 pueden no existir aún → fallback local
        throw new Error(error.message);
      }

      const automation = runAutomation({
        eventType: "booking_created",
        payload: {
          reservation_code: code,
          guest_name: body.guest_name,
          check_in: body.check_in,
          check_out: body.check_out,
          total: price ?? "",
        },
      });

      return Response.json({
        ok: true,
        mode: "supabase",
        reservation: data,
        reservation_code: code,
        quote: quoteResult.ok ? quoteResult : null,
        extras: extrasQuoted,
        channel,
        coupon: couponApplied,
        whatsapp_suggested: body.also_whatsapp !== false,
        automation,
      });
    }
  } catch {
    /* local */
  }

  const local = createLocalBooking({
    checkIn: body.check_in,
    checkOut: body.check_out,
    guests: body.guests,
    lofts: body.lofts,
    guestName: body.guest_name,
    guestPhone: body.guest_phone,
    guestEmail: body.guest_email,
    categoryId: body.category_id,
    extras: extrasPayload,
    price,
    notes: body.notes,
    pending: body.pending,
    source: body.source ?? "lofthouse14.com",
    channel,
    corporateName: body.corporate_name,
    referrerName: body.referrer_name,
  });

  if (!local.ok) {
    return Response.json(
      { error: local.error, code: local.code },
      { status: 409 },
    );
  }

  ensureFolioForReservation(local.reservation);
  const automation = runAutomation({
    eventType: "booking_created",
    payload: {
      reservation_code: local.reservation.reservation_code,
      guest_name: local.reservation.guest_name,
      check_in: local.reservation.check_in,
      check_out: local.reservation.check_out,
      total: local.reservation.price ?? "",
      channel,
    },
  });

  return Response.json({
    ok: true,
    mode: local.mode,
    note:
      local.mode === "local"
        ? "Reserva en store local durable (.data/) — aplicar migraciones 021–022 + Supabase para path remoto"
        : undefined,
    reservation: local.reservation,
    reservation_code: local.reservation.reservation_code,
    payment: local.payment ?? null,
    quote: quoteResult.ok ? quoteResult : null,
    extras: extrasQuoted,
    channel,
    coupon: couponApplied,
    whatsapp_suggested: body.also_whatsapp !== false,
    automation,
  });
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("reservations")
      .select("*")
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
    note: "Store local durable (.data/) si LH_DURABLE_STORE≠0",
    reservation: local,
  });
}
