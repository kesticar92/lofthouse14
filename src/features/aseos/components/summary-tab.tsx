// =============================================================================
// src/features/aseos/components/summary-tab.tsx
// -----------------------------------------------------------------------------
// Pestaña "Resumen": totales mensuales y del día.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import { cn } from "@/lib/cn";
import type { CleaningSummary } from "../types";
import { fmtCop } from "../format";
import { StatChip, inputClass } from "./atoms";

export function SummaryTab({
  fecha,
  onFechaChange,
  loading,
  summary,
}: {
  fecha: string;
  onFechaChange: (v: string) => void;
  loading: boolean;
  summary: CleaningSummary | null;
}) {
  return (
    <AdminCard title="Resumen mensual y del día">
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Fecha referencia
        </label>
        <input
          type="date"
          className={cn(inputClass, "mt-1 max-w-xs")}
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
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
  );
}
