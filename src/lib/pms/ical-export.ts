import { toICalDateValue, utcStampICal } from "@/lib/pms/date-range";
import type { AvailabilityBlockRow, ReservationRow } from "@/lib/pms/types";

function escapeText(s: string): string {
  return s
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > max) {
    parts.push(rest.slice(0, max));
    rest = " " + rest.slice(max);
  }
  if (rest.length) parts.push(rest);
  return parts.join("\r\n");
}

function veventBlock(opts: {
  uid: string;
  dtstamp: string;
  dtstart: string;
  dtend: string;
  summary: string;
  description: string;
}): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${opts.dtstamp}`,
    `DTSTART;VALUE=DATE:${opts.dtstart}`,
    `DTEND;VALUE=DATE:${opts.dtend}`,
    `SUMMARY:${escapeText(opts.summary)}`,
    `DESCRIPTION:${escapeText(opts.description)}`,
    "END:VEVENT",
  ];
  return lines.map((l) => foldLine(l)).join("\r\n");
}

export function buildPropertyIcs(opts: {
  reservations: ReservationRow[];
  blocks: AvailabilityBlockRow[];
}): string {
  const dtstamp = utcStampICal();
  const chunks: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lofthouse14//PMS//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:LOFTHOUSE14 - Bloqueos consolidados",
    "X-WR-TIMEZONE:UTC",
  ];
  for (const r of opts.reservations) {
    if (r.status === "cancelled") continue;
    const uid = `${r.id}@lofthouse14.com`;
    const sum = `${r.source} - ${r.status}`;
    const desc =
      r.status === "blocked" || !r.guest_name.trim() ? "Blocked" : r.guest_name;
    chunks.push(
      veventBlock({
        uid,
        dtstamp,
        dtstart: toICalDateValue(r.check_in),
        dtend: toICalDateValue(r.check_out),
        summary: sum,
        description: desc,
      }),
    );
  }
  for (const b of opts.blocks) {
    const uid = `block-${b.id}@lofthouse14.com`;
    chunks.push(
      veventBlock({
        uid,
        dtstamp,
        dtstart: toICalDateValue(b.start_date),
        dtend: toICalDateValue(b.end_date),
        summary: "internal - blocked",
        description: b.reason?.trim() ? b.reason : "Blocked",
      }),
    );
  }
  chunks.push("END:VCALENDAR");
  return chunks.join("\r\n");
}
