// =============================================================================
// src/features/cotizaciones/components/atoms.tsx
// -----------------------------------------------------------------------------
// Átomos visuales del cotizador. Son piezas pequeñas que se usan en varios
// sub-componentes del feature. Nada de lógica de negocio aquí — solo
// presentación.
// =============================================================================
"use client";

import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
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

export function NumInput({
  value,
  setValue,
  min = 1,
  max = 99,
}: {
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => setValue(Math.max(min, value - 1))}
        className="w-10 rounded-xl border border-black/10 bg-white/80 text-lg font-semibold text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-200"
        aria-label="Disminuir"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10) || min)}
        className={`${inputClass} text-center`}
      />
      <button
        type="button"
        onClick={() => setValue(Math.min(max, value + 1))}
        className="w-10 rounded-xl border border-black/10 bg-white/80 text-lg font-semibold text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-200"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}

export function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-stretch">
        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-black/10 bg-black/5 px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5">
          $
        </span>
        <input
          type="number"
          min={0}
          step={1000}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className={`${inputClass} rounded-l-none`}
        />
      </div>
    </Field>
  );
}

export function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-stretch">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={Math.round(value * 100)}
          onChange={(e) =>
            onChange(
              Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) /
                100,
            )
          }
          className={`${inputClass} rounded-r-none`}
        />
        <span className="inline-flex items-center rounded-r-xl border border-l-0 border-black/10 bg-black/5 px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5">
          %
        </span>
      </div>
    </Field>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/50">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="font-display text-2xl tracking-wide">{value}</p>
    </div>
  );
}

export function Line({
  label,
  sublabel,
  children,
  strong,
  muted,
}: {
  label: string;
  sublabel?: string;
  children: ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-3 py-2 ${
        strong ? "bg-amber-200/30 dark:bg-amber-400/10" : ""
      }`}
    >
      <div className="min-w-0">
        <dt
          className={`${strong ? "font-display text-base tracking-wide" : "font-medium"} ${
            muted ? "text-zinc-500 dark:text-zinc-400" : ""
          }`}
        >
          {label}
        </dt>
        {sublabel && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>
        )}
      </div>
      <dd
        className={`whitespace-nowrap tabular-nums ${
          strong ? "font-display text-lg" : "font-semibold"
        } ${muted ? "text-zinc-500 dark:text-zinc-400" : ""}`}
      >
        {children}
      </dd>
    </div>
  );
}
