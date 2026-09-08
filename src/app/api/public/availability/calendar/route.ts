import { nightAvailabilityCalendar } from "@/lib/availability/engine";
import {
  listLocalOccupancy,
  seedInventoryUnits,
} from "@/lib/availability/local-store";
import {
  intervalsFromDbRows,
  unitsFromCatalogRows,
} from "@/lib/booking/create-reservation";
import { ROOM_TYPE_IDS, type MarketingCategory } from "@/lib/catalog/seed";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calendario público noche-a-noche (motor Fase 3).
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&category=vista&room_type_id=
 * `to` es fin exclusivo (como check_out).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = searchParams.get("from")?.trim() || today;
  let toExclusive = searchParams.get("to")?.trim() || addDaysIso(from, 28);
  const guests = Number(searchParams.get("guests") ?? 1);
  const category = searchParams.get("category")?.trim() as
    | MarketingCategory
    | undefined;
  const roomTypeParam = searchParams.get("room_type_id")?.trim();

  if (toExclusive <= from) {
    return Response.json(
      { error: "to debe ser posterior a from (fin exclusivo)" },
      { status: 400 },
    );
  }

  // Cap 62 noches para no abusar del rate limit / CPU
  const maxTo = addDaysIso(from, 62);
  if (toExclusive > maxTo) toExclusive = maxTo;

  const roomTypeId =
    roomTypeParam ||
    (category && category in ROOM_TYPE_IDS
      ? ROOM_TYPE_IDS[category]
      : null);

  try {
    const admin = createServiceRoleClient();
    const orgId = LOFTHOUSE_ORGANIZATION_ID;
    const { data: rooms } = await admin
      .from("rooms")
      .select("id, room_type_id, legacy_property_id, code, status, max_guests")
      .eq("organization_id", orgId);

    if (rooms && rooms.length > 0) {
      const propertyIds = rooms
        .map((r) => r.legacy_property_id)
        .filter(Boolean) as string[];
      const empty = ["00000000-0000-0000-0000-000000000000"];
      const { data: reservations } = await admin
        .from("reservations")
        .select("id, property_id, check_in, check_out, status")
        .in("property_id", propertyIds.length ? propertyIds : empty)
        .neq("status", "cancelled");
      const { data: blocks } = await admin
        .from("availability_blocks")
        .select("id, property_id, start_date, end_date")
        .in("property_id", propertyIds.length ? propertyIds : empty);
      const { data: holds } = await admin
        .from("availability_holds")
        .select("id, property_id, check_in, check_out, status, expires_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());

      const units = unitsFromCatalogRows(rooms);
      const intervals = intervalsFromDbRows({
        reservations: reservations ?? [],
        blocks: blocks ?? [],
        holds: holds ?? [],
      });
      const nights = nightAvailabilityCalendar({
        units,
        intervals,
        from,
        toExclusive,
        roomTypeId,
        guests: Number.isFinite(guests) ? guests : 1,
      });
      return Response.json({
        mode: "supabase",
        from,
        to: toExclusive,
        room_type_id: roomTypeId,
        nights,
        summary: {
          available_nights: nights.filter((n) => n.available).length,
          blocked_nights: nights.filter((n) => !n.available).length,
        },
      });
    }
  } catch {
    /* local */
  }

  const nights = nightAvailabilityCalendar({
    units: seedInventoryUnits(),
    intervals: listLocalOccupancy(),
    from,
    toExclusive,
    roomTypeId,
    guests: Number.isFinite(guests) ? guests : 1,
  });

  return Response.json({
    mode: "local_seed",
    note: "Mock/seed — sin Supabase o sin rooms migrados",
    from,
    to: toExclusive,
    room_type_id: roomTypeId,
    nights,
    summary: {
      available_nights: nights.filter((n) => n.available).length,
      blocked_nights: nights.filter((n) => !n.available).length,
    },
  });
}
