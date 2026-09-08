/**
 * Notificación staff stub (sin Supabase) + intento real si hay service role.
 */

export type StaffNotificationStub = {
  id: string;
  title: string;
  body: string;
  source: string;
  created_at: string;
  delivered: "stub" | "supabase" | "failed";
};

const g = globalThis as unknown as {
  __lhStaffNotifyStub?: StaffNotificationStub[];
};

function store(): StaffNotificationStub[] {
  if (!g.__lhStaffNotifyStub) g.__lhStaffNotifyStub = [];
  return g.__lhStaffNotifyStub;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listStaffNotificationStubs(
  limit = 50,
): StaffNotificationStub[] {
  return store().slice(0, Math.max(1, limit));
}

export function resetStaffNotificationStubs() {
  g.__lhStaffNotifyStub = [];
}

export async function notifyStaffCheckIn(input: {
  reservationCode: string;
  guestName: string;
  arrivalEta: string;
}): Promise<StaffNotificationStub> {
  const row: StaffNotificationStub = {
    id: newId(),
    title: "Check-in digital completado",
    body: `${input.guestName} · ${input.reservationCode} · ETA ${input.arrivalEta}`,
    source: "digital_check_in",
    created_at: new Date().toISOString(),
    delivered: "stub",
  };

  try {
    const { createServiceRoleClient } = await import(
      "@/lib/supabase/service-role"
    );
    const {
      fetchSupervisorProfileIds,
      notifyStaffUsers,
    } = await import("@/lib/pms/panel-notifications");
    const admin = createServiceRoleClient();
    const ids = await fetchSupervisorProfileIds(admin);
    if (ids.length > 0) {
      await notifyStaffUsers(
        admin,
        ids.map((user_id) => ({
          user_id,
          title: row.title,
          message: row.body,
        })),
      );
      row.delivered = "supabase";
    } else {
      row.delivered = "stub";
    }
  } catch {
    row.delivered = "stub";
  }

  store().unshift(row);
  if (store().length > 100) store().length = 100;
  console.info("[staff-notify]", row);
  return row;
}
