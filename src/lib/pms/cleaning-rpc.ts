import type { SupabaseClient } from "@supabase/supabase-js";

export async function regenerateCleaningTasksForReservation(
  supabase: SupabaseClient,
  reservationId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc(
    "regenerate_cleaning_tasks_for_reservation",
    { p_reservation_id: reservationId },
  );
  return { error: error ? new Error(error.message) : null };
}

export async function regenerateAllCleaningTasks(
  supabase: SupabaseClient,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("regenerate_all_cleaning_tasks");
  return { error: error ? new Error(error.message) : null };
}
