import { addDays, nightCount } from "@/lib/pms/date-range";
import type { ReservationRow, SuspiciousGapAlert } from "@/lib/pms/types";

type Row = Pick<ReservationRow, "property_id" | "check_in" | "check_out" | "status">;

/**
 * Huecos de exactamente 1 noche entre estancias "ocupadas"
 * (confirmed/blocked) — posible bloqueo manual no reflejado o ventana corta.
 */
export function detectSuspiciousGaps(
  reservations: Row[],
  propertyNames: Record<string, string>,
): SuspiciousGapAlert[] {
  const active = reservations.filter(
    (r) => r.status !== "cancelled",
  );
  const byProp = new Map<string, Row[]>();
  for (const r of active) {
    const list = byProp.get(r.property_id) ?? [];
    list.push(r);
    byProp.set(r.property_id, list);
  }
  const alerts: SuspiciousGapAlert[] = [];
  for (const [propertyId, list] of byProp) {
    const sorted = [...list].sort((a, b) => a.check_in.localeCompare(b.check_in));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const spanDays = nightCount(a.check_out, b.check_in);
      const gapNights = Math.max(0, spanDays - 1);
      if (gapNights === 1) {
        alerts.push({
          property_id: propertyId,
          property_name: propertyNames[propertyId],
          gap_start: a.check_out,
          gap_end: b.check_in,
          nights: gapNights,
          message: `Hueco de 1 día entre reservas (${a.check_out} → ${b.check_in}). Revisa bloqueos o calendario Airbnb.`,
        });
      }
    }
  }
  return alerts;
}

/** Convierte rango inclusivo UI a end_date exclusivo en BD. */
export function inclusiveRangeToExclusiveEnd(
  startInclusive: string,
  endInclusive: string,
): { start_date: string; end_date: string } {
  return {
    start_date: startInclusive,
    end_date: addDays(endInclusive, 1),
  };
}
