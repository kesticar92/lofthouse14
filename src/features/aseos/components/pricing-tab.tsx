// =============================================================================
// src/features/aseos/components/pricing-tab.tsx
// -----------------------------------------------------------------------------
// Pestaña "Tarifas aseo": permite a supervisores editar la fórmula automática
// (base + extra por huésped sobre umbral). Otros roles ven solo lectura.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import type { CleaningPricing } from "../types";
import { fmtCop } from "../format";
import { Field, inputClass } from "./atoms";

export type PricingTabProps = {
  pricing: CleaningPricing | null;
  isSupervisor: boolean;
  onChange: (next: CleaningPricing) => void;
  onSubmit: () => void;
};

export function PricingTab({
  pricing,
  isSupervisor,
  onChange,
  onSubmit,
}: PricingTabProps) {
  if (!pricing) {
    return (
      <AdminCard
        title="Presupuesto automático por tarea"
        subtitle="Base en COP + extra por huésped por encima del umbral."
      >
        <p className="text-sm text-zinc-500">Cargando…</p>
      </AdminCard>
    );
  }
  return (
    <AdminCard
      title="Presupuesto automático por tarea"
      subtitle="Base en COP + extra por huésped por encima del umbral. Las reservas ya creadas conservan precio hasta regenerar (cron diario o sincronización)."
    >
      {isSupervisor ? (
        <form
          className="grid max-w-lg gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <Field label="Valor base limpieza / preparación (COP)">
            <input
              type="number"
              className={inputClass}
              value={pricing.base_cop}
              onChange={(e) =>
                onChange({ ...pricing, base_cop: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Umbral de huéspedes (sin extra)">
            <input
              type="number"
              className={inputClass}
              value={pricing.guest_threshold}
              onChange={(e) =>
                onChange({
                  ...pricing,
                  guest_threshold: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Extra por huésped adicional (COP)">
            <input
              type="number"
              className={inputClass}
              value={pricing.extra_per_guest_cop}
              onChange={(e) =>
                onChange({
                  ...pricing,
                  extra_per_guest_cop: Number(e.target.value),
                })
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
          Solo supervisores (admin) pueden editar tarifas. Valores actuales:
          base {fmtCop(pricing.base_cop)}, umbral {pricing.guest_threshold},
          extra {fmtCop(pricing.extra_per_guest_cop)}.
        </p>
      )}
    </AdminCard>
  );
}
