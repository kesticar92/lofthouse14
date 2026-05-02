/** Fecha local YYYY-MM-DD (sin TZ). */
export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Días entre start (incl.) y end (excl.), como noches de estancia. */
export function nightCount(checkIn: string, checkOutExclusive: string): number {
  const a = parseISODate(checkIn).getTime();
  const b = parseISODate(checkOutExclusive).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** Añade días a una fecha YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODateString(d);
}

/** Lista de fechas YYYY-MM-DD desde from (incl.) hasta to (excl.). */
export function eachDay(from: string, toExclusive: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur < toExclusive) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** Formato iCal all-day: YYYYMMDD */
export function toICalDateValue(iso: string): string {
  return iso.replaceAll("-", "");
}

export function utcStampICal(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}
