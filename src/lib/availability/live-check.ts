import { LOFT_CATEGORIES } from "@/data/loft-categories";
import {
  findAvailableUnits,
  type InventoryUnit,
  type OccupancyInterval,
} from "@/lib/availability/engine";
import {
  listLocalOccupancy,
  seedInventoryUnits,
} from "@/lib/availability/local-store";
import {
  alternativeCategories,
  candidateLoftsForCategory,
  pickUnitsForGuests,
  poolCapacity,
  type LoftCandidate,
} from "@/lib/availability/loft-priority";
import {
  hasAnyIcalConfigured,
  icalUrlForLoft,
} from "@/lib/availability/loft-ical-map";
import { CATALOG_ROOMS, type MarketingCategory } from "@/lib/catalog/seed";
import { fetchAndParseIcal } from "@/lib/pms/ical-sync";

export type LoftCategoryId = MarketingCategory;

export type LiveAvailabilityOk = {
  ok: true;
  categoryId: LoftCategoryId;
  assignedUnits: number[];
  source: "ical" | "local";
  checkedAt: string;
  warning?: string;
};

export type LiveAvailabilityAlt = {
  ok: false;
  reason: "no_availability" | "category_full" | "no_units_for_guests";
  requestedCategoryId: LoftCategoryId;
  message: string;
  alternative: {
    categoryId: LoftCategoryId;
    name: string;
    priceFromCop: number;
    assignedUnits: number[];
  } | null;
  alternatives: Array<{
    categoryId: LoftCategoryId;
    name: string;
    priceFromCop: number;
    assignedUnits: number[];
  }>;
  source: "ical" | "local";
  checkedAt: string;
  warning?: string;
};

export type LiveAvailabilityResult = LiveAvailabilityOk | LiveAvailabilityAlt;

function loftCode(n: number): string {
  return `LOFT ${String(n).padStart(2, "0")}`;
}

function unitForLoft(
  loft: number,
  inventory: InventoryUnit[],
): InventoryUnit | undefined {
  return inventory.find((u) => u.unitCode === loftCode(loft));
}

function categoryMeta(id: LoftCategoryId) {
  const cat = LOFT_CATEGORIES.find((c) => c.id === id);
  return {
    name: cat?.name ?? id,
    priceFromCop: cat?.priceFromCop ?? 0,
  };
}

async function busyIntervalsForLoft(
  loft: number,
  propertyId: string,
): Promise<{
  intervals: OccupancyInterval[];
  configured: boolean;
  error?: string;
}> {
  const url = icalUrlForLoft(loft);
  if (!url) return { intervals: [], configured: false };

  try {
    const stays = await fetchAndParseIcal(url);
    const intervals: OccupancyInterval[] = stays
      .filter((s) => s.status !== "cancelled")
      .map((s) => ({
        propertyId,
        start: s.check_in,
        endExclusive: s.check_out_exclusive,
        kind: s.status === "blocked" ? ("block" as const) : ("reservation" as const),
        status: "active",
      }));
    return { intervals, configured: true };
  } catch (err) {
    return {
      intervals: [],
      configured: true,
      error: err instanceof Error ? err.message : "Error al consultar iCal",
    };
  }
}

async function buildIcalBusyByLoft(
  lofts: number[],
  inventory: InventoryUnit[],
): Promise<{
  byLoft: Map<number, OccupancyInterval[]>;
  configuredCount: number;
  errors: string[];
}> {
  const byLoft = new Map<number, OccupancyInterval[]>();
  const errors: string[] = [];
  let configuredCount = 0;

  await Promise.all(
    lofts.map(async (loft) => {
      const unit = unitForLoft(loft, inventory);
      if (!unit) {
        byLoft.set(loft, []);
        return;
      }
      const { intervals, configured, error } = await busyIntervalsForLoft(
        loft,
        unit.propertyId,
      );
      if (configured) configuredCount += 1;
      if (error) errors.push(`Loft ${loft}: ${error}`);
      byLoft.set(loft, intervals);
    }),
  );

  return { byLoft, configuredCount, errors };
}

function buildLocalBusyByLoft(
  lofts: number[],
  inventory: InventoryUnit[],
): Map<number, OccupancyInterval[]> {
  const all = listLocalOccupancy();
  const byLoft = new Map<number, OccupancyInterval[]>();
  for (const loft of lofts) {
    const unit = unitForLoft(loft, inventory);
    if (!unit) {
      byLoft.set(loft, []);
      continue;
    }
    byLoft.set(
      loft,
      all.filter((iv) => iv.propertyId === unit.propertyId),
    );
  }
  return byLoft;
}

function freeCandidates(
  candidates: LoftCandidate[],
  checkIn: string,
  checkOut: string,
  busyByLoft: Map<number, OccupancyInterval[]>,
  inventory: InventoryUnit[],
): LoftCandidate[] {
  const free: LoftCandidate[] = [];
  for (const c of candidates) {
    const unit = unitForLoft(c.unitNumber, inventory);
    if (!unit || unit.status !== "active") continue;

    const available = findAvailableUnits({
      units: [unit],
      intervals: busyByLoft.get(c.unitNumber) ?? [],
      checkIn,
      checkOut,
    });
    if (available.length > 0) free.push(c);
  }
  return free;
}

function tryAssignCategory(params: {
  categoryId: LoftCategoryId;
  guests: number;
  checkIn: string;
  checkOut: string;
  busyByLoft: Map<number, OccupancyInterval[]>;
  inventory: InventoryUnit[];
  minUnits?: number;
}): number[] | null {
  const candidates = candidateLoftsForCategory(params.categoryId, params.guests);
  if (candidates.length === 0 || poolCapacity(candidates) < params.guests) {
    return null;
  }

  const free = freeCandidates(
    candidates,
    params.checkIn,
    params.checkOut,
    params.busyByLoft,
    params.inventory,
  );
  const picked = pickUnitsForGuests(
    free,
    params.guests,
    params.minUnits ?? 1,
  );
  if (!picked) return null;
  return picked.map((p) => p.unitNumber);
}

/**
 * Disponibilidad en el momento de reservar.
 * Con iCal configurado consulta Airbnb en vivo; si no, motor local.
 */
export async function checkLiveAvailability(params: {
  categoryId: LoftCategoryId;
  guests: number;
  checkIn: string;
  checkOut: string;
  /** Mínimo de lofts/unidades pedidas por el huésped. */
  lofts?: number;
}): Promise<LiveAvailabilityResult> {
  const checkedAt = new Date().toISOString();
  const inventory = seedInventoryUnits();
  const allLofts = CATALOG_ROOMS.filter((r) => r.status === "active").map(
    (r) => r.unit_number,
  );
  const minUnits = Math.max(1, Math.floor(params.lofts ?? 1));

  let busyByLoft: Map<number, OccupancyInterval[]>;
  let source: "ical" | "local" = "local";
  let warning: string | undefined;

  if (hasAnyIcalConfigured()) {
    const { byLoft, configuredCount, errors } = await buildIcalBusyByLoft(
      allLofts,
      inventory,
    );
    busyByLoft = byLoft;
    source = "ical";
    if (configuredCount === 0) {
      busyByLoft = buildLocalBusyByLoft(allLofts, inventory);
      source = "local";
      warning =
        "No hay URLs iCal configuradas; se usó el calendario interno. Configura LOFT_ICAL_URL_* o .data/loft-ical-urls.json.";
    } else if (errors.length > 0) {
      warning = `Algunos calendarios Airbnb no respondieron (${errors.slice(0, 2).join("; ")}). Se consultó lo disponible.`;
    }
  } else {
    busyByLoft = buildLocalBusyByLoft(allLofts, inventory);
    source = "local";
    warning =
      "Calendarios Airbnb (iCal) aún no configurados. Verificación con motor interno. Pega las URLs iCal de cada loft para disponibilidad en vivo.";
  }

  const assigned = tryAssignCategory({
    categoryId: params.categoryId,
    guests: params.guests,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    busyByLoft,
    inventory,
    minUnits,
  });

  if (assigned && assigned.length > 0) {
    return {
      ok: true,
      categoryId: params.categoryId,
      assignedUnits: assigned,
      source,
      checkedAt,
      warning,
    };
  }

  const candidates = candidateLoftsForCategory(
    params.categoryId,
    params.guests,
  );
  const reason: LiveAvailabilityAlt["reason"] =
    candidates.length === 0 || poolCapacity(candidates) < params.guests
      ? "no_units_for_guests"
      : "category_full";

  const alternatives: LiveAvailabilityAlt["alternatives"] = [];
  for (const altId of alternativeCategories(params.categoryId)) {
    const altAssigned = tryAssignCategory({
      categoryId: altId,
      guests: params.guests,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      busyByLoft,
      inventory,
      minUnits,
    });
    if (altAssigned && altAssigned.length > 0) {
      const meta = categoryMeta(altId);
      alternatives.push({
        categoryId: altId,
        name: meta.name,
        priceFromCop: meta.priceFromCop,
        assignedUnits: altAssigned,
      });
    }
  }

  const preferred = alternatives[0] ?? null;
  const requestedName = categoryMeta(params.categoryId).name;

  let message: string;
  if (reason === "no_units_for_guests") {
    message = `El tipo ${requestedName} no admite ${params.guests} huéspedes con las reglas de capacidad (el loft 5 de Atrio admite máximo 3; grupos grandes usan 7+8 y, de 11 a 13, también el 5).`;
  } else if (preferred) {
    message = `No hay disponibilidad de ${requestedName} para esas fechas. Te sugerimos ${preferred.name}, que sí está libre ahora.`;
  } else {
    message = `No hay disponibilidad de ${requestedName} ni de otros tipos para esas fechas y ${params.guests} huéspedes.`;
  }

  return {
    ok: false,
    reason,
    requestedCategoryId: params.categoryId,
    message,
    alternative: preferred,
    alternatives,
    source,
    checkedAt,
    warning,
  };
}

export function isValidCategoryId(value: string): value is LoftCategoryId {
  return value === "cielo" || value === "atrio" || value === "vista";
}
