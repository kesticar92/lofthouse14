// =============================================================================
// src/features/cotizaciones/components/config-tarifas-card.tsx
// -----------------------------------------------------------------------------
// Tarjeta para ajustar la configuración de tarifas y descuentos. El padre
// mantiene el estado y persistencia (localStorage por ahora).
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import type { PricingConfig } from "@/lib/pricing";
import { MoneyField, PercentField } from "./atoms";

export type ConfigTarifasCardProps = {
  config: PricingConfig;
  onChange: <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) => void;
  onReset: () => void;
};

export function ConfigTarifasCard({
  config,
  onChange,
  onReset,
}: ConfigTarifasCardProps) {
  return (
    <AdminCard
      title="Configuración de tarifas"
      subtitle="Ajusta las tarifas y se guardarán automáticamente. Modifica solo si cambiaste los precios oficialmente."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MoneyField
          label="Tarifa por noche (Lun-Jue)"
          value={config.tarifaLJ}
          onChange={(v) => onChange("tarifaLJ", v)}
        />
        <MoneyField
          label="Tarifa por noche (Vie-Dom)"
          value={config.tarifaVD}
          onChange={(v) => onChange("tarifaVD", v)}
        />
        <MoneyField
          label="Recargo huésped adicional (por noche)"
          value={config.recargoHuesped}
          onChange={(v) => onChange("recargoHuesped", v)}
        />
        <MoneyField
          label="Aseo 1–2 noches (por loft)"
          value={config.aseoCorta}
          onChange={(v) => onChange("aseoCorta", v)}
        />
        <MoneyField
          label="Aseo 3–7 noches (por loft)"
          value={config.aseoMedia}
          onChange={(v) => onChange("aseoMedia", v)}
        />
        <MoneyField
          label="Aseo por semana (>7 noches)"
          value={config.aseoSemanal}
          onChange={(v) => onChange("aseoSemanal", v)}
        />
        <PercentField
          label="Descuento semanal (≥7 noches)"
          value={config.descuentoSemanal}
          onChange={(v) => onChange("descuentoSemanal", v)}
        />
        <PercentField
          label="Descuento mensual (≥28 noches)"
          value={config.descuentoMensual}
          onChange={(v) => onChange("descuentoMensual", v)}
        />
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
      >
        Restablecer valores por defecto
      </button>
    </AdminCard>
  );
}
