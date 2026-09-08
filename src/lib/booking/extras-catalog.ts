/**
 * Catálogo de extras para booking (seed + quote server-side).
 * Reutiliza precios de configurator-extras (early check-in, late checkout,
 * desayuno, traslado, etc.).
 */

import {
  CONFIGURATOR_EXTRAS,
  airportTransferLegCount,
  extraLineTotalCop,
  type AirportTransferChoice,
  type ConfiguratorExtra,
  type MealExtraId,
  type MealExtraQuantity,
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

export type QuoteExtrasInput = {
  selectedIds: string[];
  guests?: number;
  nights?: number;
  mealQuantities?: Partial<Record<MealExtraId, MealExtraQuantity>>;
  airportTransfer?: AirportTransferChoice;
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
  const mealDefault = defaultMealQty(nights, guests);
  const airport = input.airportTransfer ?? { pickup: false, dropoff: false };
  const lines: BookingExtraLine[] = [];

  for (const id of input.selectedIds) {
    const extra = getExtraById(id);
    if (!extra) continue;
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
          : { pickup: true, dropoff: false };
    }

    const amountCop = extraLineTotalCop(extra, {
      mealQty,
      airport: airportChoice,
    });
    lines.push({
      id: extra.id,
      label: extra.label,
      amountCop,
      pricing: extra.pricing,
      meta:
        extra.id === "airport-transfer"
          ? { legs: airportTransferLegCount(airportChoice!) }
          : mealQty
            ? { days: mealQty.days, guests: mealQty.guests }
            : undefined,
    });
  }

  const totalCop = lines.reduce((s, l) => s + l.amountCop, 0);
  return { lines, totalCop, catalog_version: "configurator-v1" };
}

/**
 * Normaliza payload cliente → líneas cotizadas desde seed.
 * Si el body trae amountCop pero el id es conocido, se reprices.
 */
export function normalizeClientExtras(
  raw: Array<{ id: string; label?: string; amountCop?: number }> | undefined,
  ctx: { guests?: number; nights?: number },
): QuoteExtrasResult {
  if (!raw?.length) {
    return { lines: [], totalCop: 0, catalog_version: "configurator-v1" };
  }
  const ids = raw.map((r) => r.id);
  const quoted = quoteBookingExtras({
    selectedIds: ids,
    guests: ctx.guests,
    nights: ctx.nights,
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
