import {
  availabilityByRoomType,
  findAvailableUnits,
} from "@/lib/availability/engine";
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("check_in")?.trim() ?? "";
  const checkOut = searchParams.get("check_out")?.trim() ?? "";
  const guests = Number(searchParams.get("guests") ?? 1);
  const category = searchParams.get("category")?.trim() as
    | MarketingCategory
    | undefined;
  const roomTypeParam = searchParams.get("room_type_id")?.trim();

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return Response.json(
      { error: "check_in y check_out requeridos (fin exclusivo)" },
      { status: 400 },
    );
  }

  const roomTypeId =
    roomTypeParam ||
    (category && category in ROOM_TYPE_IDS
      ? ROOM_TYPE_IDS[category]
      : null);

  // Intentar Supabase; si no hay credenciales → local seed/mock
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

      const { data: reservations } = await admin
        .from("reservations")
        .select("id, property_id, check_in, check_out, status")
        .in("property_id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
        .neq("status", "cancelled");

      const { data: blocks } = await admin
        .from("availability_blocks")
        .select("id, property_id, start_date, end_date")
        .in("property_id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);

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

      const available = findAvailableUnits({
        units,
        intervals,
        checkIn,
        checkOut,
        roomTypeId,
        guests: Number.isFinite(guests) ? guests : 1,
      });
      const byType = availabilityByRoomType({
        units,
        intervals,
        checkIn,
        checkOut,
        guests: Number.isFinite(guests) ? guests : 1,
      });

      return Response.json({
        mode: "supabase",
        check_in: checkIn,
        check_out: checkOut,
        available_count: available.length,
        available_units: available.map((u) => ({
          property_id: u.propertyId,
          room_id: u.roomId,
          room_type_id: u.roomTypeId,
          code: u.unitCode,
        })),
        by_room_type: byType,
      });
    }
  } catch {
    /* fallback local */
  }

  const units = seedInventoryUnits();
  const intervals = listLocalOccupancy();
  const available = findAvailableUnits({
    units,
    intervals,
    checkIn,
    checkOut,
    roomTypeId,
    guests: Number.isFinite(guests) ? guests : 1,
  });
  const byType = availabilityByRoomType({
    units,
    intervals,
    checkIn,
    checkOut,
    guests: Number.isFinite(guests) ? guests : 1,
  });

  return Response.json({
    mode: "local_seed",
    note: "Mock/seed — sin Supabase o sin rooms migrados",
    check_in: checkIn,
    check_out: checkOut,
    available_count: available.length,
    available_units: available.map((u) => ({
      property_id: u.propertyId,
      room_id: u.roomId,
      room_type_id: u.roomTypeId,
      code: u.unitCode,
    })),
    by_room_type: byType,
  });
}
