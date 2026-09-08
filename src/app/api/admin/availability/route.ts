import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  availabilityByRoomType,
  findAvailableUnits,
} from "@/lib/availability/engine";
import {
  listLocalOccupancy,
  listLocalReservations,
  seedInventoryUnits,
} from "@/lib/availability/local-store";
import {
  intervalsFromDbRows,
  unitsFromCatalogRows,
} from "@/lib/booking/create-reservation";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "reservas");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("check_in")?.trim() ?? "";
  const checkOut = searchParams.get("check_out")?.trim() ?? "";
  if (!checkIn || !checkOut) {
    return Response.json(
      { error: "check_in y check_out requeridos" },
      { status: 400 },
    );
  }

  const { supabase, organizationId } = gate.ctx;
  if (organizationId) {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("id, room_type_id, legacy_property_id, code, status, max_guests")
      .eq("organization_id", organizationId);
    if (!error && rooms && rooms.length > 0) {
      const propertyIds = rooms
        .map((r) => r.legacy_property_id)
        .filter(Boolean) as string[];
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, property_id, check_in, check_out, status")
        .eq("organization_id", organizationId);
      const { data: blocks } = await supabase
        .from("availability_blocks")
        .select("id, property_id, start_date, end_date");

      const units = unitsFromCatalogRows(rooms);
      const intervals = intervalsFromDbRows({
        reservations: (reservations ?? []).filter((r) =>
          propertyIds.length
            ? propertyIds.includes(r.property_id)
            : true,
        ),
        blocks: blocks ?? [],
      });

      return Response.json({
        mode: "supabase",
        available: findAvailableUnits({
          units,
          intervals,
          checkIn,
          checkOut,
        }),
        by_room_type: availabilityByRoomType({
          units,
          intervals,
          checkIn,
          checkOut,
        }),
        open_reservations: reservations?.length ?? 0,
      });
    }
  }

  return Response.json({
    mode: "local_seed",
    note: "Admin local sin catálogo remoto",
    available: findAvailableUnits({
      units: seedInventoryUnits(),
      intervals: listLocalOccupancy(),
      checkIn,
      checkOut,
    }),
    by_room_type: availabilityByRoomType({
      units: seedInventoryUnits(),
      intervals: listLocalOccupancy(),
      checkIn,
      checkOut,
    }),
    local_reservations: listLocalReservations().length,
  });
}
