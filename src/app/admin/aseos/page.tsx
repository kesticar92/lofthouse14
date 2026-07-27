"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { fetchAdminSession } from "@/lib/auth-client";
import { sourceLabel } from "@/lib/pms/colors";
import { cn } from "@/lib/cn";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtCop(n: number) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

type CleaningTask = {
  id: string;
  property_id: string;
  property_name?: string;
  reservation_id: string | null;
  task_date: string;
  type: string;
  status: string;
  assigned_to: string | null;
  guests: number;
  source: string;
  guest_name: string;
  check_in: string | null;
  check_out: string | null;
  notes: string;
  bed_setup_notes: string;
  cleaning_price: number | null;
  estimated_time_label: string;
};

type StaffRow = { id: string; full_name: string; email: string | null; role: string };

type Pricing = {
  base_cop: number;
  guest_threshold: number;
  extra_per_guest_cop: number;
};

const TAB = ["lista", "resumen", "tarifas"] as const;
type Tab = (typeof TAB)[number];

export default function AseosPage() {
  const [tab, setTab] = useState<Tab>("lista");
  const [fecha, setFecha] = useState("");
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [summary, setSummary] = useState<{
    today: {
      cleaning: number;
      preparation: number;
      manual: number;
      revenue_scheduled_cop: number;
      revenue_done_cop: number;
    };
    month_totals: {
      revenue_scheduled_cop: number;
      revenue_done_cop: number;
      task_count: number;
    };
  } | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [manualPid, setManualPid] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualGuests, setManualGuests] = useState("2");
  const [myRole, setMyRole] = useState("");

  useEffect(() => {
    void (async () => {
      const s = await fetchAdminSession();
      setMyRole(s?.role ?? "");
    })();
  }, []);

  const isSupervisor = myRole === "admin" || myRole === "super_admin";

  const loadTasks = useCallback(async (date: string) => {
    const res = await fetch(
      `/api/admin/cleaning-tasks?date=${encodeURIComponent(date)}`,
      { credentials: "include" },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    setTasks(j.tasks ?? []);
  }, []);

  const loadSummary = useCallback(async (date: string) => {
    const month = date.slice(0, 7);
    const res = await fetch(
      `/api/admin/cleaning-summary?date=${encodeURIComponent(date)}&month=${encodeURIComponent(month)}`,
      { credentials: "include" },
    );
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    setSummary(j);
  }, []);

  const loadPricing = useCallback(async () => {
    const res = await fetch("/api/admin/app-settings/cleaning", {
      credentials: "include",
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? res.statusText);
    setPricing(j.pricing);
  }, []);

  const refreshAll = useCallback(async () => {
    const d = fecha || todayISO();
    setErr(null);
    setLoading(true);
    try {
      await Promise.all([
        loadTasks(d),
        loadSummary(d),
        loadPricing(),
      ]);
      const [rs, rp] = await Promise.all([
        fetch("/api/admin/staff-directory", { credentials: "include" }),
        fetch("/api/admin/pms/properties", { credentials: "include" }),
      ]);
      const sj = await rs.json();
      const pj = await rp.json();
      if (rs.ok) setStaff(sj.staff ?? []);
      if (rp.ok) setProperties(pj.properties ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fecha, loadTasks, loadSummary, loadPricing]);

  useEffect(() => {
    const d = todayISO();
    setFecha(d);
    setManualDate(d);
  }, []);

  useEffect(() => {
    if (!fecha) return;
    void refreshAll();
  }, [fecha, refreshAll]);

  async function patchTask(
    id: string,
    patch: Record<string, unknown>,
  ) {
    setErr(null);
    const res = await fetch(`/api/admin/cleaning-tasks/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? res.statusText);
      return;
    }
    setMsg("Actualizado.");
    setTimeout(() => setMsg(null), 2000);
    await refreshAll();
  }

  async function savePricing(e: React.FormEvent) {
    e.preventDefault();
    if (!pricing) return;
    setErr(null);
    const res = await fetch("/api/admin/app-settings/cleaning", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricing),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? res.statusText);
      return;
    }
    setPricing(j.pricing);
    setMsg("Tarifas guardadas. Las nuevas reservas usarán estos valores.");
    setTimeout(() => setMsg(null), 3000);
    await refreshAll();
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/admin/cleaning-tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: manualPid,
        task_date: manualDate,
        notes: manualNotes,
        guests: Number(manualGuests) || 1,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error ?? res.statusText);
      return;
    }
    setManualNotes("");
    setMsg("Tarea manual creada.");
    setTimeout(() => setMsg(null), 2500);
    await refreshAll();
  }

  function taskTypeLabel(t: string) {
    if (t === "cleaning") return "Limpieza (check-out)";
    if (t === "preparation") return "Preparación (check-in)";
    return "Manual";
  }

  const delDia = useMemo(
    () =>
      [...tasks].sort((a, b) =>
        a.estimated_time_label.localeCompare(b.estimated_time_label),
      ),
    [tasks],
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
              Operación de aseo
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              Tareas generadas desde{" "}
              <strong>reservas confirmadas</strong>: limpieza el día del check-out
              y preparación el día del check-in.{" "}
              <Link
                href="/admin/reservas"
                className="font-semibold text-amber-900 underline dark:text-amber-400"
              >
                Ver calendario central
              </Link>
              .
            </p>
          </div>
        </div>

        {(msg || err) && (
          <div
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              err
                ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
            )}
          >
            {err || msg}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TAB.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
                tab === t
                  ? "bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-900"
                  : "border border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-900/60",
              )}
            >
              {t === "lista"
                ? "Tareas del día"
                : t === "resumen"
                  ? "Resumen"
                  : "Tarifas aseo"}
            </button>
          ))}
        </div>

        {tab === "lista" && (
          <>
            <AdminCard
              title="Resumen rápido"
              subtitle={fecha}
            >
              {loading || !summary ? (
                <p className="text-sm text-zinc-500">Cargando…</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatChip
                    label="Limpiezas hoy"
                    value={summary.today.cleaning}
                    color="amber"
                  />
                  <StatChip
                    label="Preparaciones hoy"
                    value={summary.today.preparation}
                    color="blue"
                  />
                  <StatChip
                    label="Ingresos aseo hoy (programado)"
                    value={fmtCop(summary.today.revenue_scheduled_cop)}
                  />
                  <StatChip
                    label="Ingresos aseo hoy (hecho)"
                    value={fmtCop(summary.today.revenue_done_cop)}
                    color="green"
                  />
                </div>
              )}
            </AdminCard>

            <AdminCard title="Selector de fecha">
              <input
                type="date"
                className={inputClass}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </AdminCard>

            <AdminCard title="Tarea manual (extra)">
              <form
                className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
                onSubmit={(e) => void addManual(e)}
              >
                <Field label="Propiedad">
                  <select
                    className={inputClass}
                    required
                    value={manualPid}
                    onChange={(e) => setManualPid(e.target.value)}
                  >
                    <option value="">—</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha">
                  <input
                    type="date"
                    className={inputClass}
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </Field>
                <Field label="Huéspedes (precio)">
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={manualGuests}
                    onChange={(e) => setManualGuests(e.target.value)}
                  />
                </Field>
                <Field label="Notas">
                  <input
                    className={inputClass}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Extra fuera de reserva…"
                  />
                </Field>
                <div className="md:col-span-2 lg:col-span-4">
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:bg-[#f2f0eb] dark:text-zinc-900"
                  >
                    Crear tarea manual
                  </button>
                </div>
              </form>
            </AdminCard>

            <AdminCard
              title={`Checklist · ${fecha}`}
              subtitle="Marca estado y asigna personal (supervisores)."
            >
              {loading ? (
                <p className="text-sm text-zinc-500">Cargando tareas…</p>
              ) : delDia.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No hay tareas para esta fecha. Las reservas confirmadas generan
                  preparación y limpieza automáticamente.
                </p>
              ) : (
                <ul className="space-y-3">
                  {delDia.map((t) => (
                    <li
                      key={t.id}
                      className={cn(
                        "rounded-xl border p-4 dark:border-white/10",
                        t.status === "done"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : t.status === "in_progress"
                            ? "border-sky-500/30 bg-sky-500/5"
                            : "border-amber-500/25 bg-amber-500/5",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {t.property_name ?? "—"} · {taskTypeLabel(t.type)}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {t.estimated_time_label}
                            {t.guest_name ? ` · ${t.guest_name}` : ""} · Fuente:{" "}
                            {sourceLabel(t.source || "direct")} · {t.guests}{" "}
                            huéspedes
                          </p>
                          {t.bed_setup_notes ? (
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                              Camas / prep: {t.bed_setup_notes}
                            </p>
                          ) : null}
                          {t.notes ? (
                            <p className="mt-1 text-xs text-zinc-500">{t.notes}</p>
                          ) : null}
                          <p className="mt-1 text-sm font-medium text-amber-900 dark:text-amber-300">
                            {fmtCop(Number(t.cleaning_price ?? 0))}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            className={smallSelect}
                            value={t.status}
                            onChange={(e) =>
                              void patchTask(t.id, { status: e.target.value })
                            }
                          >
                            <option value="pending">Pendiente</option>
                            <option value="in_progress">En progreso</option>
                            <option value="done">Hecho</option>
                          </select>
                          {isSupervisor ? (
                            <select
                              className={smallSelect}
                              value={t.assigned_to ?? ""}
                              onChange={(e) =>
                                void patchTask(t.id, {
                                  assigned_to: e.target.value || null,
                                })
                              }
                            >
                              <option value="">Sin asignar</option>
                              {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.full_name || s.email || s.id.slice(0, 8)}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </>
        )}

        {tab === "resumen" && (
          <AdminCard title="Resumen mensual y del día">
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Fecha referencia
              </label>
              <input
                type="date"
                className={cn(inputClass, "mt-1 max-w-xs")}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            {loading || !summary ? (
              <p className="text-sm text-zinc-500">Cargando…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <StatChip
                  label="Tareas programadas en el mes"
                  value={summary.month_totals.task_count}
                />
                <StatChip
                  label="Ingresos aseo mes (programado)"
                  value={fmtCop(summary.month_totals.revenue_scheduled_cop)}
                />
                <StatChip
                  label="Ingresos aseo mes (hechas)"
                  value={fmtCop(summary.month_totals.revenue_done_cop)}
                  color="green"
                />
              </div>
            )}
          </AdminCard>
        )}

        {tab === "tarifas" && (
          <AdminCard
            title="Presupuesto automático por tarea"
            subtitle="Base en COP + extra por huésped por encima del umbral. Las reservas ya creadas conservan precio hasta regenerar (cron diario o sincronización)."
          >
            {!pricing ? (
              <p className="text-sm text-zinc-500">Cargando…</p>
            ) : isSupervisor ? (
              <form className="grid max-w-lg gap-4" onSubmit={(e) => void savePricing(e)}>
                <Field label="Valor base limpieza / preparación (COP)">
                  <input
                    type="number"
                    className={inputClass}
                    value={pricing.base_cop}
                    onChange={(e) =>
                      setPricing((p) =>
                        p ? { ...p, base_cop: Number(e.target.value) } : p,
                      )
                    }
                  />
                </Field>
                <Field label="Umbral de huéspedes (sin extra)">
                  <input
                    type="number"
                    className={inputClass}
                    value={pricing.guest_threshold}
                    onChange={(e) =>
                      setPricing((p) =>
                        p ? { ...p, guest_threshold: Number(e.target.value) } : p,
                      )
                    }
                  />
                </Field>
                <Field label="Extra por huésped adicional (COP)">
                  <input
                    type="number"
                    className={inputClass}
                    value={pricing.extra_per_guest_cop}
                    onChange={(e) =>
                      setPricing((p) =>
                        p
                          ? { ...p, extra_per_guest_cop: Number(e.target.value) }
                          : p,
                      )
                    }
                  />
                </Field>
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:bg-amber-500 dark:text-zinc-900"
                >
                  Guardar tarifas
                </button>
              </form>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Solo supervisores (admin) pueden editar tarifas. Valores actuales: base{" "}
                {fmtCop(pricing.base_cop)}, umbral {pricing.guest_threshold}, extra{" "}
                {fmtCop(pricing.extra_per_guest_cop)}.
              </p>
            )}
          </AdminCard>
        )}
      </div>
    </AdminShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";
const smallSelect =
  "rounded-lg border border-black/10 bg-white/80 px-2 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-900/70";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: "green" | "amber" | "blue";
}) {
  const palette: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
  return (
    <div
      className={cn(
        "rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/10",
        color ? palette[color] : "bg-white/60 dark:bg-zinc-900/50",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="font-display text-xl tracking-wide">{value}</p>
    </div>
  );
}
