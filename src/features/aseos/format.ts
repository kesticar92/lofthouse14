// =============================================================================
// src/features/aseos/format.ts
// -----------------------------------------------------------------------------
// Formato monetario y label de tipo de tarea.
// =============================================================================

export function fmtCop(n: number): string {
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

export function taskTypeLabel(t: string): string {
  if (t === "cleaning") return "Limpieza (check-out)";
  if (t === "preparation") return "Preparación (check-in)";
  return "Manual";
}
