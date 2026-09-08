/**
 * Persistencia check-in digital: Supabase si hay env; fallback store local.
 */

import {
  getDigitalCheckIn,
  saveDigitalCheckIn,
  type DigitalCheckInPayload,
} from "./check-in-store";
import { notifyStaffCheckIn } from "./staff-notify";

export type PersistCheckInResult = {
  ok: boolean;
  mode: "supabase" | "local";
  checkIn?: DigitalCheckInPayload;
  error?: string;
  staffNotification?: Awaited<ReturnType<typeof notifyStaffCheckIn>>;
};

export async function persistDigitalCheckIn(
  payload: DigitalCheckInPayload,
): Promise<PersistCheckInResult> {
  const local = saveDigitalCheckIn(payload);
  if (!local.ok) {
    return { ok: false, mode: "local", error: local.error };
  }

  let mode: "supabase" | "local" = "local";

  try {
    const { createServiceRoleClient } = await import(
      "@/lib/supabase/service-role"
    );
    const admin = createServiceRoleClient();
    // Tabla dedicada puede no existir: guardamos nota en reservations + metadata JSON si hay columna.
    const { error } = await admin
      .from("reservations")
      .update({
        notes: `check-in digital ETA ${local.checkIn.arrival_eta} @ ${local.checkIn.completed_at}`,
        guest_name: local.checkIn.guest_name || undefined,
      })
      .eq("reservation_code", local.checkIn.reservation_code);

    if (!error) {
      mode = "supabase";
      // Intento opcional tabla digital_check_ins (migración futura)
      try {
        await admin.from("digital_check_ins").upsert({
          reservation_code: local.checkIn.reservation_code,
          guest_name: local.checkIn.guest_name,
          guest_phone: local.checkIn.guest_phone ?? null,
          guest_email: local.checkIn.guest_email ?? null,
          guests: local.checkIn.guests,
          arrival_eta: local.checkIn.arrival_eta,
          terms_accepted: local.checkIn.terms_accepted,
          data_confirmed: local.checkIn.data_confirmed,
          notes: local.checkIn.notes ?? null,
          completed_at: local.checkIn.completed_at,
          payload: local.checkIn,
        });
      } catch {
        /* tabla no existe — OK */
      }
    }
  } catch {
    mode = "local";
  }

  const staffNotification = await notifyStaffCheckIn({
    reservationCode: local.checkIn.reservation_code,
    guestName: local.checkIn.guest_name,
    arrivalEta: local.checkIn.arrival_eta,
  });

  return {
    ok: true,
    mode,
    checkIn: getDigitalCheckIn(local.checkIn.reservation_code) ?? local.checkIn,
    staffNotification,
  };
}
