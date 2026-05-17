// =============================================================================
// src/features/aseos/components/atoms.tsx
// -----------------------------------------------------------------------------
// Átomos visuales del feature de aseos (Field con label, StatChip, inputs).
// =============================================================================
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";

export const smallSelectClass =
  "rounded-lg border border-black/10 bg-white/80 px-2 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-900/70";

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

export function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: "green" | "amber" | "blue" | "red";
}) {
  const palette: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    red: "bg-red-500/10 text-red-700 dark:text-red-300",
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
