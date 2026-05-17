// =============================================================================
// src/features/cotizaciones/components/desglose-noches-table.tsx
// -----------------------------------------------------------------------------
// Tabla "Desglose noche por noche". Solo se muestra cuando el cálculo es OK.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import { formatCOP, type QuoteResult } from "@/lib/pricing";

export function DesgloseNochesTable({ result }: { result: QuoteResult }) {
  if (!result.ok) return null;
  return (
    <AdminCard title="Desglose noche por noche">
      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-black/5 text-[11px] uppercase tracking-wider text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left">Noche</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Día</th>
              <th className="px-3 py-2 text-right">Tarifa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {result.nightByNight.map((n) => (
              <tr
                key={n.n}
                className={n.esFinDeSemana ? "bg-amber-200/10" : ""}
              >
                <td className="px-3 py-2">{n.n}</td>
                <td className="px-3 py-2">{n.date}</td>
                <td className="px-3 py-2">{n.dia}</td>
                <td className="px-3 py-2 text-right">{formatCOP(n.tarifa)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-black/5 font-semibold dark:bg-white/5">
              <td className="px-3 py-2" colSpan={3}>
                Total alojamiento
              </td>
              <td className="px-3 py-2 text-right">
                {formatCOP(result.subtotalAlojamiento)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </AdminCard>
  );
}
