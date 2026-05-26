import * as nodeIcal from "node-ical";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarResponse, VEvent } from "node-ical";
export type ParsedIcalStay = {
  external_id: string;
  check_in: string;
  check_out_exclusive: string;
  status: "confirmed" | "blocked" | "cancelled";
  ical_summary: string;
};

function pvToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "val" in (v as object)) {
    return String((v as { val: string }).val);
  }
  return String(v);
}

function asDate(d: unknown): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === "object" && d !== null && "getTime" in d) {
    const t = (d as Date).getTime();
    if (!Number.isNaN(t)) return d as Date;
  }
  return null;
}

/** Fecha calendario en UTC (Airbnb exporta DATE en UTC). */
function asUtcYmd(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** Heurística SUMMARY Airbnb: reservado vs no disponible / bloqueo. */
export function inferAirbnbStatusFromSummary(
  summary: string,
  veventStatus?: string,
): "confirmed" | "blocked" | "cancelled" {
  if (veventStatus === "CANCELLED") return "cancelled";
  const s = summary.toLowerCase();
  if (
    s.includes("not available") ||
    s.includes("no disponible") ||
    s.includes("unavailable") ||
    s.includes("blocked") ||
    s.includes("bloque") ||
    s.includes("airbnb (not available)")
  ) {
    return "blocked";
  }
  if (
    s.includes("reserved") ||
    s.includes("reservation") ||
    s.includes("reserva")
  ) {
    return "confirmed";
  }
  return "confirmed";
}

export function parseAirbnbIcalEvents(cal: CalendarResponse): ParsedIcalStay[] {
  const out: ParsedIcalStay[] = [];
  for (const comp of Object.values(cal)) {
    if (!comp || typeof comp !== "object") continue;
    if ((comp as { type?: string }).type !== "VEVENT") continue;
    const ev = comp as VEvent;
    const uid = (ev.uid ?? "").trim();
    if (!uid) continue;
    const startD = asDate(ev.start);
    const endD = asDate(ev.end);
    if (!startD || !endD) continue;
    const checkIn = asUtcYmd(startD);
    const checkOutExclusive = asUtcYmd(endD);
    if (checkOutExclusive <= checkIn) continue;
    const summary = pvToString(ev.summary);
    const st = inferAirbnbStatusFromSummary(summary, ev.status);
    out.push({
      external_id: uid,
      check_in: checkIn,
      check_out_exclusive: checkOutExclusive,
      status: st,
      ical_summary: summary,
    });
  }
  return out;
}

export async function fetchAndParseIcal(
  url: string,
): Promise<ParsedIcalStay[]> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`iCal HTTP ${res.status}`);
  }
  const text = await res.text();
  const cal = await nodeIcal.async.parseICS(text);
  return parseAirbnbIcalEvents(cal);
}

/** Upsert reservas importadas (Airbnb). Sin datos de huésped en iCal.
 * `icalSourceId` permite vincular cada reserva al iCal del que provino, de modo
 * que al eliminar el iCal (FK ON DELETE CASCADE) desaparezcan también sus
 * reservas y no quede rastro visual en el timeline. */
export async function upsertAirbnbStays(
  admin: SupabaseClient,
  propertyId: string,
  stays: ParsedIcalStay[],
  icalSourceId?: string | null,
): Promise<{ upserted: number; errors: string[] }> {
  const errors: string[] = [];
  let upserted = 0;
  for (const s of stays) {
    const row = {
      property_id: propertyId,
      source: "airbnb",
      external_id: s.external_id,
      guest_name: "",
      guest_phone: "",
      check_in: s.check_in,
      check_out: s.check_out_exclusive,
      guests: 1,
      price: null as number | null,
      status: s.status,
      notes: "",
      ical_summary: s.ical_summary,
      ical_source_id: icalSourceId ?? null,
    };
    const { data: existing, error: selErr } = await admin
      .from("reservations")
      .select("id, ical_source_id")
      .eq("property_id", propertyId)
      .eq("external_id", s.external_id)
      .maybeSingle();
    if (selErr) {
      errors.push(selErr.message);
      continue;
    }
    if (existing?.id) {
      const update: Record<string, unknown> = {
        check_in: row.check_in,
        check_out: row.check_out,
        status: row.status,
        ical_summary: row.ical_summary,
        updated_at: new Date().toISOString(),
      };
      // Backfill best-effort: si la reserva legacy no tiene vínculo y este sync
      // sí trae sourceId, la adoptamos para que un futuro borrado del iCal la
      // limpie también.
      if (!existing.ical_source_id && icalSourceId) {
        update.ical_source_id = icalSourceId;
      }
      const { error: upErr } = await admin
        .from("reservations")
        .update(update)
        .eq("id", existing.id);
      if (upErr) errors.push(upErr.message);
      else upserted++;
    } else {
      const { error: insErr } = await admin.from("reservations").insert(row);
      if (insErr) errors.push(insErr.message);
      else upserted++;
    }
  }
  return { upserted, errors };
}

export async function syncIcalSource(
  admin: SupabaseClient,
  sourceId: string,
  propertyId: string,
  url: string,
): Promise<{ ok: boolean; message: string; upserted: number }> {
  try {
    const stays = await fetchAndParseIcal(url);
    const { upserted, errors } = await upsertAirbnbStays(
      admin,
      propertyId,
      stays,
      sourceId,
    );
    const now = new Date().toISOString();
    await admin
      .from("ical_sources")
      .update({ last_sync: now, updated_at: now })
      .eq("id", sourceId);
    const msg =
      errors.length > 0
        ? `Sincronizado con avisos: ${errors.slice(0, 3).join("; ")}`
        : "Sincronizado correctamente.";
    return { ok: errors.length === 0, message: msg, upserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg, upserted: 0 };
  }
}
