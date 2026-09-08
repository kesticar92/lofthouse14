/**
 * Métricas PMS (Fase 6): ocupación, ADR, RevPAR.
 */

export type MetricReservation = {
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
  price: number | null;
};

function parseDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(0, Math.round((parseDay(checkOut) - parseDay(checkIn)) / 86_400_000));
}

function eachNight(from: string, toExclusive: string): string[] {
  const out: string[] = [];
  let t = parseDay(from);
  const end = parseDay(toExclusive);
  while (t < end) {
    out.push(new Date(t).toISOString().slice(0, 10));
    t += 86_400_000;
  }
  return out;
}

const ACTIVE = new Set(["confirmed", "pending", "checked_in", "blocked"]);

export type PmsMetrics = {
  from: string;
  to: string;
  rooms: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  occupancyRate: number;
  roomRevenue: number;
  adr: number;
  revpar: number;
  arrivals: number;
  departures: number;
  inHouse: number;
};

/**
 * @param from inclusive YYYY-MM-DD
 * @param to exclusive YYYY-MM-DD (o inclusive end+1)
 */
export function computePmsMetrics(params: {
  from: string;
  to: string;
  rooms: number;
  reservations: MetricReservation[];
  asOf?: string;
}): PmsMetrics {
  const rooms = Math.max(0, params.rooms);
  const nights = nightsBetween(params.from, params.to);
  const roomNightsAvailable = rooms * nights;
  const asOf = params.asOf ?? new Date().toISOString().slice(0, 10);

  let roomNightsSold = 0;
  let roomRevenue = 0;
  let arrivals = 0;
  let departures = 0;
  let inHouse = 0;

  for (const r of params.reservations) {
    if (!ACTIVE.has(r.status) && r.status !== "checked_out") continue;

    if (ACTIVE.has(r.status)) {
      const overlapNights = eachNight(params.from, params.to).filter(
        (d) => d >= r.check_in && d < r.check_out,
      ).length;
      roomNightsSold += overlapNights;
      if (r.price != null && Number.isFinite(r.price)) {
        const totalNights = nightsBetween(r.check_in, r.check_out) || 1;
        roomRevenue += (Number(r.price) / totalNights) * overlapNights;
      }
    }

    if (r.check_in >= params.from && r.check_in < params.to && ACTIVE.has(r.status)) {
      arrivals++;
    }
    if (
      r.check_out >= params.from &&
      r.check_out < params.to &&
      (ACTIVE.has(r.status) || r.status === "checked_out")
    ) {
      departures++;
    }
    if (
      ACTIVE.has(r.status) &&
      r.check_in <= asOf &&
      r.check_out > asOf
    ) {
      inHouse++;
    }
  }

  const occupancyRate =
    roomNightsAvailable > 0 ? roomNightsSold / roomNightsAvailable : 0;
  const adr = roomNightsSold > 0 ? roomRevenue / roomNightsSold : 0;
  const revpar = roomNightsAvailable > 0 ? roomRevenue / roomNightsAvailable : 0;

  return {
    from: params.from,
    to: params.to,
    rooms,
    roomNightsAvailable,
    roomNightsSold,
    occupancyRate,
    roomRevenue,
    adr,
    revpar,
    arrivals,
    departures,
    inHouse,
  };
}
