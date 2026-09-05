import type { SupabaseClient } from "@supabase/supabase-js";

/** Intervalos [check_in, check_out) en fechas ISO. */
export async function findReservationConflicts(
  supabase: SupabaseClient,
  propertyId: string,
  checkIn: string,
  checkOutExclusive: string,
  excludeReservationId?: string,
): Promise<{ id: string }[]> {
  let q = supabase
    .from("reservations")
    .select("id")
    .eq("property_id", propertyId)
    .neq("status", "cancelled")
    .lt("check_in", checkOutExclusive)
    .gt("check_out", checkIn);
  if (excludeReservationId) {
    q = q.neq("id", excludeReservationId);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function findBlockConflicts(
  supabase: SupabaseClient,
  propertyId: string,
  startDate: string,
  endDateExclusive: string,
  excludeBlockId?: string,
): Promise<{ id: string }[]> {
  let q = supabase
    .from("availability_blocks")
    .select("id")
    .eq("property_id", propertyId)
    .lt("start_date", endDateExclusive)
    .gt("end_date", startDate);
  if (excludeBlockId) q = q.neq("id", excludeBlockId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function reservationOverlapsBlocks(
  supabase: SupabaseClient,
  propertyId: string,
  checkIn: string,
  checkOutExclusive: string,
): Promise<{ id: string }[]> {
  return findBlockConflicts(supabase, propertyId, checkIn, checkOutExclusive);
}
