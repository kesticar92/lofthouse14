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
import { stubAutomationEvent } from "@/lib/crm/templates";
import { unifiedQuote, SEED_RATE_PLANS } from "@/lib/pricing/unified";

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
        label: z.string(),
        amountCop: z.number().optional(),
      }),
    )
    .optional(),
  notes: z.string().max(2000).optional(),
  pending: z.boolean().optional(),
  /** Si true, también sugiere abrir WhatsApp (coexistencia) */
  also_whatsapp: z.boolean().optional(),
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
  const price = quoteResult.ok ? quoteResult.totalReserva : null;

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
        extras: body.extras ?? [],
        source: "lofthouse14.com",
        channel: "direct",
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

      const automation = stubAutomationEvent("booking_created", {
        reservation_code: code,
        guest_name: body.guest_name,
      });

      return Response.json({
        ok: true,
        mode: "supabase",
        reservation: data,
        reservation_code: code,
        quote: quoteResult.ok ? quoteResult : null,
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
    extras: body.extras,
    price,
    notes: body.notes,
    pending: body.pending,
    source: "lofthouse14.com",
  });

  if (!local.ok) {
    return Response.json(
      { error: local.error, code: local.code },
      { status: 409 },
    );
  }

  return Response.json({
    ok: true,
    mode: local.mode,
    note:
      local.mode === "local"
        ? "Reserva en store local (mock) — aplicar migraciones 021–022 para persistir en Supabase"
        : undefined,
    reservation: local.reservation,
    reservation_code: local.reservation.reservation_code,
    quote: quoteResult.ok ? quoteResult : null,
    whatsapp_suggested: body.also_whatsapp !== false,
    automation: stubAutomationEvent("booking_created", {
      reservation_code: local.reservation.reservation_code,
    }),
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
    note: "Store local en memoria del proceso",
    reservation: local,
  });
}
