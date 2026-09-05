/**
 * Valores alineados con la validación de datos en GASTOS.xlsx (Google Sheets).
 */
export const GASTOS_SHEET_CATEGORIES = [
  "LIMPIEZA",
  "SUMINISTROS",
  "MANTENIMIENTO",
  "SERVICIOS PUBLICOS",
  "PUBLICIDAD",
  "TECNOLOGIA",
  "IMPUESTOS Y LEGALES",
  "SEGUROS",
  "CONTINGENCIAS",
  "ARRENDAMIENTO",
  "OTRO",
  "COMISIONES",
] as const;

export function normalizeGastosCategory(raw: string): string {
  const u = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if ((GASTOS_SHEET_CATEGORIES as readonly string[]).includes(u)) {
    return u;
  }
  return u || "OTRO";
}

export function formatFechaForSheet(expenseDateISO: string): string {
  const d = expenseDateISO.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return expenseDateISO;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function formatMontoForSheet(amount: number): string {
  const n = Math.round(Number(amount));
  if (!Number.isFinite(n)) return "$0";
  return `$${n.toLocaleString("en-US")}`;
}
