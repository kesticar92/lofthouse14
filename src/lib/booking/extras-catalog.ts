/**
 * Catálogo de extras para booking (seed + quote server-side).
 * Reutiliza precios de configurator-extras (early check-in, late checkout,
 * desayuno, traslado, etc.).
 */

import {
  CONFIGURATOR_EXTRAS,
  airportTransferLegCount,
  clampAirportVehicles,
  clampMealDays,
  clampPetCount,
  clampTimingUnits,
  extraLineTotalCop,
  isEarlyCheckInOffered,
  maxPetsForLofts,
  minAirportVehicles,
  type AirportTransferChoice,
  type ConfiguratorExtra,
  type MealExtraId,
  type MealExtraQuantity,
  type TimingExtraId,
  type TimingExtraQuantity,
} from "@/lib/configurator-extras";

export type BookingExtraLine = {
  id: string;
  label: string;
  amountCop: number;
  pricing?: ConfiguratorExtra["pricing"];
  meta?: Record<string, unknown>;
};

/** Extras prioritarios del wizard / resumen (siempre en seed). */
export const BOOKING_EXTRAS_FOCUS_IDS = [
  "early-checkin",
  "late-checkout",
  "breakfast",
  "airport-transfer",
] as const;

export function seedBookingExtrasCatalog(): ConfiguratorExtra[] {
  return [...CONFIGURATOR_EXTRAS];
}

export function getExtraById(id: string): ConfiguratorExtra | undefined {
  return CONFIGURATOR_EXTRAS.find((e) => e.id === id);
}

export type ClientExtraInput = {
  id: string;
  label?: string;
  amountCop?: number;
  /** Lofts que solicitan early/late. */
  units?: number;
  /** Vehículos de traslado. */
  vehicles?: number;
  pickup?: boolean;
  dropoff?: boolean;
  mealDays?: number;
  mealGuests?: number;
};

export type QuoteExtrasInput = {
  selectedIds: string[];
  guests?: number;
  nights?: number;
  lofts?: number;
  /** YYYY-MM-DD — si es hoy ≥ 14:00 Bogotá, se ignora early-checkin. */
  checkIn?: string;
  mealQuantities?: Partial<Record<MealExtraId, MealExtraQuantity>>;
  airportTransfer?: AirportTransferChoice;
  timingQuantities?: Partial<Record<TimingExtraId, TimingExtraQuantity>>;
};

export type QuoteExtrasResult = {
  lines: BookingExtraLine[];
  totalCop: number;
  catalog_version: string;
};

function defaultMealQty(
  nights: number,
  guests: number,
): MealExtraQuantity {
  const days = nights <= 0 ? 0 : nights === 1 ? 1 : nights - 1;
  return { days, guests: Math.max(1, guests) };
}

/**
 * Cotiza extras desde el catálogo seed (ignora amountCop del cliente).
 */
export function quoteBookingExtras(input: QuoteExtrasInput): QuoteExtrasResult {
  const guests = Math.max(1, Math.floor(input.guests ?? 1));
  const nights = Math.max(0, Math.floor(input.nights ?? 1));
  const lofts = Math.max(1, Math.floor(input.lofts ?? 1));
  const mealDefault = defaultMealQty(nights, guests);
  const airportIn = input.airportTransfer ?? {
    pickup: false,
    dropoff: false,
    vehicles: minAirportVehicles(guests),
  };
  const airport: AirportTransferChoice = {
    pickup: airportIn.pickup,
    dropoff: airportIn.dropoff,
    vehicles: clampAirportVehicles(airportIn.vehicles, guests),
  };
  const lines: BookingExtraLine[] = [];

  for (const id of input.selectedIds) {
    const extra = getExtraById(id);
    if (!extra) continue;
    if (
      extra.id === "early-checkin" &&
      !isEarlyCheckInOffered(input.checkIn ?? "")
    ) {
      continue;
    }
    if (extra.interestOnly) {
      lines.push({
        id: extra.id,
        label: extra.label,
        amountCop: 0,
        pricing: extra.pricing,
        meta: { interest_only: true },
      });
      continue;
    }

    let mealQty: MealExtraQuantity | undefined;
    if (extra.id === "breakfast" || extra.id === "lunch") {
      mealQty = input.mealQuantities?.[extra.id] ?? mealDefault;
    }
    let airportChoice: AirportTransferChoice | undefined;
    if (extra.id === "airport-transfer") {
      airportChoice =
        airportTransferLegCount(airport) > 0
          ? airport
          : {
              pickup: true,
              dropoff: false,
              vehicles: clampAirportVehicles(airport.vehicles, guests),
            };
    }
    let units: number | undefined;
    let petCount: number | undefined;
    if (extra.id === "early-checkin" || extra.id === "late-checkout") {
      units = clampTimingUnits(
        input.timingQuantities?.[extra.id]?.units ?? lofts,
        lofts,
      );
    }
    if (extra.id === "pet") {
      petCount = clampPetCount(
        input.timingQuantities?.pet?.units ?? 1,
        lofts,
      );
    }

    let mealQtyClamped = mealQty;
    if (mealQty && (extra.id === "breakfast" || extra.id === "lunch")) {
      mealQtyClamped = {
        ...mealQty,
        days: clampMealDays(mealQty.days, nights),
      };
    }

    const amountCop = extraLineTotalCop(extra, {
      mealQty: mealQtyClamped,
      airport: airportChoice,
      units,
      petCount,
    });
    lines.push({
      id: extra.id,
      label: extra.label,
      amountCop,
      pricing: extra.pricing,
      meta:
        extra.id === "airport-transfer"
          ? {
              legs: airportTransferLegCount(airportChoice!),
              vehicles: airportChoice!.vehicles,
            }
          : extra.id === "early-checkin" || extra.id === "late-checkout"
            ? { units }
            : extra.id === "pet"
              ? { pets: petCount, maxPets: maxPetsForLofts(lofts) }
              : mealQtyClamped
                ? { days: mealQtyClamped.days, guests: mealQtyClamped.guests }
                : undefined,
    });
  }

  const totalCop = lines.reduce((s, l) => s + l.amountCop, 0);
  return { lines, totalCop, catalog_version: "configurator-v2" };
}

/**
 * Normaliza payload cliente → líneas cotizadas desde seed.
 * Si el body trae amountCop pero el id es conocido, se reprices.
 */
export function normalizeClientExtras(
  raw: ClientExtraInput[] | undefined,
  ctx: {
    guests?: number;
    nights?: number;
    lofts?: number;
    checkIn?: string;
  },
): QuoteExtrasResult {
  if (!raw?.length) {
    return { lines: [], totalCop: 0, catalog_version: "configurator-v2" };
  }
  const ids = raw.map((r) => r.id);
  const guests = Math.max(1, Math.floor(ctx.guests ?? 1));
  const lofts = Math.max(1, Math.floor(ctx.lofts ?? 1));

  const timingQuantities: Partial<
    Record<TimingExtraId, TimingExtraQuantity>
  > = {};
  const mealQuantities: Partial<Record<MealExtraId, MealExtraQuantity>> = {};
  let airportTransfer: AirportTransferChoice | undefined;

  for (const r of raw) {
    if (r.id === "early-checkin" || r.id === "late-checkout") {
      timingQuantities[r.id] = {
        units: clampTimingUnits(r.units ?? lofts, lofts),
      };
    }
    if (r.id === "pet") {
      timingQuantities.pet = {
        units: clampPetCount(r.units ?? 1, lofts),
      };
    }
    if (r.id === "breakfast" || r.id === "lunch") {
      const nights = Math.max(0, Math.floor(ctx.nights ?? 0));
      mealQuantities[r.id] = {
        days: clampMealDays(r.mealDays ?? 0, nights),
        guests: Math.max(1, Math.floor(r.mealGuests ?? guests)),
      };
    }
    if (r.id === "airport-transfer") {
      airportTransfer = {
        pickup: Boolean(r.pickup),
        dropoff: Boolean(r.dropoff),
        vehicles: clampAirportVehicles(
          r.vehicles ?? minAirportVehicles(guests),
          guests,
        ),
      };
      if (
        airportTransferLegCount(airportTransfer) === 0 &&
        (r.pickup === undefined || r.dropoff === undefined)
      ) {
        // Compat: si no vienen flags, asumir al menos recogida.
        airportTransfer.pickup = true;
      }
    }
  }

  const quoted = quoteBookingExtras({
    selectedIds: ids,
    guests: ctx.guests,
    nights: ctx.nights,
    lofts: ctx.lofts,
    checkIn: ctx.checkIn,
    mealQuantities,
    airportTransfer,
    timingQuantities,
  });
  // Conservar labels desconocidos (custom) con amountCop del cliente
  const known = new Set(quoted.lines.map((l) => l.id));
  for (const r of raw) {
    if (known.has(r.id)) continue;
    quoted.lines.push({
      id: r.id,
      label: r.label ?? r.id,
      amountCop: Math.max(0, Math.round(r.amountCop ?? 0)),
      meta: { custom: true },
    });
  }
  quoted.totalCop = quoted.lines.reduce((s, l) => s + l.amountCop, 0);
  return quoted;
}
