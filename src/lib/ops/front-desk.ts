/**
 * Front desk day view — arrivals / departures / in-house.
 */

import type { LocalReservation } from "@/lib/availability/local-store";

export type FrontDeskBucket = "arrivals" | "departures" | "in_house";

export type FrontDeskRow = {
  id: string;
  reservation_code: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  status: string;
  channel: string;
  property_id: string;
  room_id: string | null;
  guests: number;
  payment_status: string;
  bucket: FrontDeskBucket;
};

const ACTIVE = new Set(["confirmed", "pending", "checked_in", "blocked"]);

export function buildFrontDeskDay(
  reservations: LocalReservation[],
  day: string,
): {
  date: string;
  arrivals: FrontDeskRow[];
  departures: FrontDeskRow[];
  in_house: FrontDeskRow[];
} {
  const arrivals: FrontDeskRow[] = [];
  const departures: FrontDeskRow[] = [];
  const in_house: FrontDeskRow[] = [];

  for (const r of reservations) {
    if (r.status === "cancelled") continue;
    const base = {
      id: r.id,
      reservation_code: r.reservation_code,
      guest_name: r.guest_name,
      guest_phone: r.guest_phone,
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      channel: r.channel || r.source || "direct",
      property_id: r.property_id,
      room_id: r.room_id,
      guests: r.guests,
      payment_status: r.payment_status,
    };

    if (r.check_in === day && ACTIVE.has(r.status)) {
      arrivals.push({ ...base, bucket: "arrivals" });
    }
    if (
      r.check_out === day &&
      (ACTIVE.has(r.status) || r.status === "checked_out")
    ) {
      departures.push({ ...base, bucket: "departures" });
    }
    if (ACTIVE.has(r.status) && r.check_in <= day && r.check_out > day) {
      in_house.push({ ...base, bucket: "in_house" });
    }
  }

  const byCode = (a: FrontDeskRow, b: FrontDeskRow) =>
    a.guest_name.localeCompare(b.guest_name) ||
    a.reservation_code.localeCompare(b.reservation_code);

  return {
    date: day,
    arrivals: arrivals.sort(byCode),
    departures: departures.sort(byCode),
    in_house: in_house.sort(byCode),
  };
}
