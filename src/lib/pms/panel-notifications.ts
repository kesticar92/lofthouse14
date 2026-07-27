import type { SupabaseClient } from "@supabase/supabase-js";
import { sourceLabel } from "@/lib/pms/colors";

/** Notificaciones masivas (requiere cliente service role; si falla, no rompe el flujo). */
export async function notifyStaffUsers(
  admin: SupabaseClient,
  rows: { user_id: string; title: string; message: string }[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    console.error("panel-notifications insert", error.message);
  }
}

export async function fetchSupervisorProfileIds(
  admin: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["super_admin", "admin"]);
  if (error || !data) return [];
  return data.map((r) => r.id);
}

export async function notifySupervisorsNewReservation(
  admin: SupabaseClient,
  opts: {
    propertyName: string;
    guestName: string;
    source: string;
    checkIn: string;
    checkOut: string;
  },
): Promise<void> {
  const ids = await fetchSupervisorProfileIds(admin);
  const guest = opts.guestName?.trim() || "Sin nombre";
  const title = "Nueva reserva";
  const origin = sourceLabel(opts.source);
  const message = `${opts.propertyName}: ${guest} (${origin}) · ${opts.checkIn} → ${opts.checkOut}`;
  await notifyStaffUsers(
    admin,
    ids.map((user_id) => ({ user_id, title, message })),
  );
}

export async function notifySupervisorsDailyCleaningDigest(
  admin: SupabaseClient,
  todayISO: string,
): Promise<void> {
  const { data: tasks, error } = await admin
    .from("cleaning_tasks")
    .select("id, type, task_date, guest_name, property_id")
    .eq("task_date", todayISO)
    .in("type", ["cleaning", "preparation"]);
  if (error || !tasks?.length) return;

  const { data: props } = await admin.from("properties").select("id,name");
  const nameMap = Object.fromEntries(
    (props ?? []).map((p) => [p.id, p.name as string]),
  );

  const cleaning = tasks.filter((t) => t.type === "cleaning").length;
  const prep = tasks.filter((t) => t.type === "preparation").length;
  const ids = await fetchSupervisorProfileIds(admin);
  if (ids.length === 0) return;

  const lines = tasks.slice(0, 12).map((t) => {
    const pname = nameMap[t.property_id] ?? "Propiedad";
    const gn = (t as { guest_name?: string }).guest_name?.trim() || "—";
    const ty =
      t.type === "cleaning" ? "Limpieza" : "Preparación";
    return `· ${ty} ${pname} — ${gn}`;
  });
  const more =
    tasks.length > 12 ? `\n… y ${tasks.length - 12} más` : "";
  const title =
    cleaning + prep > 3
      ? "Varias tareas de aseo hoy"
      : "Tareas de aseo hoy";
  const message = `Hoy (${todayISO}): ${cleaning} limpieza(s), ${prep} preparación(es).\n${lines.join("\n")}${more}`;

  await notifyStaffUsers(
    admin,
    ids.map((user_id) => ({ user_id, title, message })),
  );
}
