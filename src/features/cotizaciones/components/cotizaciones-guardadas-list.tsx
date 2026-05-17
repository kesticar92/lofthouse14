// =============================================================================
// src/features/cotizaciones/components/cotizaciones-guardadas-list.tsx
// -----------------------------------------------------------------------------
// Lista de cotizaciones guardadas con acciones Cargar / Eliminar.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import { formatCOP } from "@/lib/pricing";
import type { Cotizacion } from "../types";

export type CotizacionesGuardadasListProps = {
  cotizaciones: Cotizacion[];
  onLoad: (c: Cotizacion) => void;
  onDelete: (id: number) => void;
};

export function CotizacionesGuardadasList({
  cotizaciones,
  onLoad,
  onDelete,
}: CotizacionesGuardadasListProps) {
  return (
    <AdminCard
      title={`Cotizaciones guardadas (${cotizaciones.length})`}
      subtitle="Tus últimas cotizaciones. Toca una para recargarla y volver a editarla."
    >
      {cotizaciones.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aún no hay cotizaciones guardadas.
        </p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {cotizaciones.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold">{c.cliente}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {c.input.checkIn} → {c.input.checkOut} · {c.result.noches}{" "}
                  noche(s) · {c.input.huespedes} huésped(es) · {c.input.lofts}{" "}
                  loft(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold dark:bg-white/10">
                  {formatCOP(c.result.totalReserva)}
                </span>
                <button
                  type="button"
                  onClick={() => onLoad(c)}
                  className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Cargar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-500/10 dark:text-red-300"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
