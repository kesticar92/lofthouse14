// =============================================================================
// src/features/cotizaciones/components/resumen-total-card.tsx
// -----------------------------------------------------------------------------
// Tarjeta de resumen + total con los botones de acción (guardar, WhatsApp,
// copiar, imprimir). El padre pasa el resultado calculado y las callbacks.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import { formatCOP, type QuoteResult } from "@/lib/pricing";
import { Line, MiniStat } from "./atoms";

export type ResumenTotalCardProps = {
  result: QuoteResult;
  onSave: () => void;
  onWhatsApp: () => void;
  onCopy: () => void;
  onPrint: () => void;
  saving?: boolean;
};

export function ResumenTotalCard({
  result,
  onSave,
  onWhatsApp,
  onCopy,
  onPrint,
  saving,
}: ResumenTotalCardProps) {
  return (
    <AdminCard title="Resumen y total">
      {!result.ok ? (
        <p className="rounded-lg bg-amber-200/50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
          {result.error || "Completa los datos para ver el cálculo."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MiniStat label="Noches" value={result.noches.toString()} />
            <MiniStat
              label="L-J / V-D"
              value={`${result.nochesLJ} / ${result.nochesVD}`}
            />
          </div>

          <dl className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white/70 text-sm dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900/60">
            <Line label="Alojamiento">{formatCOP(result.subtotalAlojamiento)}</Line>
            <Line label="Recargo huéspedes">
              {formatCOP(result.recargoHuespedes)}
            </Line>
            <Line label="Impuesto de aseo" sublabel={result.aseoDetalle}>
              {formatCOP(result.aseoTotal)}
            </Line>
            <Line label="Subtotal">{formatCOP(result.subtotalReserva)}</Line>
            <Line label="Descuento" sublabel={result.descuentoDetalle}>
              {formatCOP(result.descuento)}
            </Line>
            <Line label="TOTAL RESERVA" strong>
              {formatCOP(result.totalReserva)}
            </Line>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#f2f0eb] dark:text-zinc-900"
            >
              {saving ? "Guardando…" : "Guardar cotización"}
            </button>
            <button
              type="button"
              onClick={onWhatsApp}
              className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#1ebe5b]"
            >
              Enviar por WhatsApp
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
            >
              Copiar resumen
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="rounded-full border border-amber-700/40 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-900 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
            >
              Generar PDF
            </button>
          </div>
        </div>
      )}
    </AdminCard>
  );
}
