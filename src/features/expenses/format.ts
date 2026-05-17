// =============================================================================
// src/features/expenses/format.ts
// -----------------------------------------------------------------------------
// Helpers de formateo del feature de gastos.
// =============================================================================

export function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function driveStatusLabel(s: string): string {
  if (s === "success") return "Drive OK";
  if (s === "failed") return "Drive falló";
  return "Pendiente";
}
