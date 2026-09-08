/**
 * Extensiones de reportes: CSV Excel-friendly + breakdown por canal.
 */

import type { PmsMetrics } from "@/lib/pms/metrics";
import { metricsToCsv } from "@/lib/analytics/reports";

export type ChannelRevenueRow = {
  channel: string;
  reservations: number;
  revenue: number;
  room_nights: number;
};

export type ReportReservation = {
  channel?: string | null;
  source?: string | null;
  check_in: string;
  check_out: string;
  status: string;
  price: number | null;
};

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86_400_000);
}

const ACTIVE = new Set([
  "confirmed",
  "pending",
  "checked_in",
  "checked_out",
  "blocked",
]);

export function channelRevenueBreakdown(
  reservations: ReportReservation[],
  from: string,
  to: string,
): ChannelRevenueRow[] {
  const map = new Map<string, ChannelRevenueRow>();
  for (const r of reservations) {
    if (!ACTIVE.has(r.status)) continue;
    if (r.check_out <= from || r.check_in >= to) continue;
    const channel = (r.channel || r.source || "direct").trim() || "direct";
    const row = map.get(channel) ?? {
      channel,
      reservations: 0,
      revenue: 0,
      room_nights: 0,
    };
    row.reservations += 1;
    row.revenue += Math.round(r.price ?? 0);
    row.room_nights += nightsBetween(
      r.check_in < from ? from : r.check_in,
      r.check_out > to ? to : r.check_out,
    );
    map.set(channel, row);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

/** CSV con BOM UTF-8 + separador `;` amigable para Excel ES. */
export function toExcelCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.map(esc).join(";"),
    ...rows.map((r) => r.map(esc).join(";")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function occupancyRevenueCsv(params: {
  metrics: PmsMetrics;
  channels: ChannelRevenueRow[];
}): string {
  const m = params.metrics;
  const base = toExcelCsv(
    [
      "from",
      "to",
      "rooms",
      "room_nights_available",
      "room_nights_sold",
      "occupancy_rate",
      "room_revenue",
      "adr",
      "revpar",
      "arrivals",
      "departures",
      "in_house",
    ],
    [
      [
        m.from,
        m.to,
        m.rooms,
        m.roomNightsAvailable,
        m.roomNightsSold,
        Number(m.occupancyRate.toFixed(4)),
        Math.round(m.roomRevenue),
        Math.round(m.adr),
        Math.round(m.revpar),
        m.arrivals,
        m.departures,
        m.inHouse,
      ],
    ],
  );

  const channelBlock = toExcelCsv(
    ["channel", "reservations", "revenue", "room_nights"],
    params.channels.map((c) => [
      c.channel,
      c.reservations,
      c.revenue,
      c.room_nights,
    ]),
  );

  // metricsToCsv sigue disponible como alias legacy (coma)
  void metricsToCsv;
  return `${base}\r\n${channelBlock}`;
}
