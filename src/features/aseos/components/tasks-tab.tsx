// =============================================================================
// src/features/aseos/components/tasks-tab.tsx
// -----------------------------------------------------------------------------
// Pestaña "Tareas del día": resumen rápido, selector de fecha, formulario
// manual y checklist con asignación de personal.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import { sourceLabel } from "@/lib/pms/colors";
import { cn } from "@/lib/cn";
import type {
  CleaningPricing,
  CleaningStaff,
  CleaningSummary,
  CleaningTask,
} from "../types";
import { fmtCop, taskTypeLabel } from "../format";
import { Field, StatChip, inputClass, smallSelectClass } from "./atoms";

export type TasksTabProps = {
  fecha: string;
  onFechaChange: (v: string) => void;
  summary: CleaningSummary | null;
  loading: boolean;
  tasks: CleaningTask[];
  properties: { id: string; name: string }[];
  staff: CleaningStaff[];
  isSupervisor: boolean;
  pricing: CleaningPricing | null;
  manualPid: string;
  setManualPid: (v: string) => void;
  manualDate: string;
  setManualDate: (v: string) => void;
  manualGuests: string;
  setManualGuests: (v: string) => void;
  manualNotes: string;
  setManualNotes: (v: string) => void;
  onAddManual: () => void;
  onPatchTask: (id: string, patch: Record<string, unknown>) => void;
};

export function TasksTab(props: TasksTabProps) {
  const {
    fecha,
    onFechaChange,
    summary,
    loading,
    tasks,
    properties,
    staff,
    isSupervisor,
    manualPid,
    setManualPid,
    manualDate,
    setManualDate,
    manualGuests,
    setManualGuests,
    manualNotes,
    setManualNotes,
    onAddManual,
    onPatchTask,
  } = props;

  const delDia = [...tasks].sort((a, b) =>
    a.estimated_time_label.localeCompare(b.estimated_time_label),
  );

  return (
    <>
      <AdminCard title="Resumen rápido" subtitle={fecha}>
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
          onChange={(e) => onFechaChange(e.target.value)}
        />
      </AdminCard>

      <AdminCard title="Tarea manual (extra)">
        <form
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            onAddManual();
          }}
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
                      {sourceLabel(t.source || "direct")} · {t.guests} huéspedes
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
                      className={smallSelectClass}
                      value={t.status}
                      onChange={(e) =>
                        onPatchTask(t.id, { status: e.target.value })
                      }
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En progreso</option>
                      <option value="done">Hecho</option>
                    </select>
                    {isSupervisor ? (
                      <select
                        className={smallSelectClass}
                        value={t.assigned_to ?? ""}
                        onChange={(e) =>
                          onPatchTask(t.id, {
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
  );
}
