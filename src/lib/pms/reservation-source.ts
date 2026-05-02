/** Origen unificado: "manual" legado → directa (sin comisión a terceros). */
export function normalizeReservationSource(raw: string | undefined): string {
  const t = (raw ?? "direct").trim().toLowerCase();
  if (!t) return "direct";
  if (t === "manual") return "direct";
  return t;
}
