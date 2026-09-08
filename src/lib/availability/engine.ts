/**
 * Motor de disponibilidad unificada (Fase 3).
 * Lógica pura: reservas, bloques, holds, out_of_service.
 * Impide double-booking a nivel de intervalos [start, endExclusive).
 */

import { rangesOverlap } from "@/lib/pms/overlap";

export type UnitStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "storage"
  | "out_of_service";

export type InventoryUnit = {
  /** ID unidad PMS (`properties.id`) */
  propertyId: string;
  roomId?: string | null;
  roomTypeId?: string | null;
  unitCode?: string;
  status: UnitStatus;
  maxGuests?: number;
};

export type OccupancyKind = "reservation" | "block" | "hold" | "out_of_service";

export type OccupancyInterval = {
  id?: string;
  propertyId: string;
  start: string;
  endExclusive: string;
  kind: OccupancyKind;
  /** cancelled / expired / consumed no ocupan */
  status?: string;
};

const NON_OCCUPYING = new Set([
  "cancelled",
  "expired",
  "consumed",
  "no_show",
]);

export function isUnitBookable(unit: InventoryUnit): boolean {
  return unit.status === "active";
}

export function intervalOccupies(interval: OccupancyInterval): boolean {
  if (interval.kind === "out_of_service") return true;
  const st = (interval.status ?? "active").toLowerCase();
  if (NON_OCCUPYING.has(st)) return false;
  return true;
}

export function unitConflictsWith(
  unit: InventoryUnit,
  checkIn: string,
  checkOutExclusive: string,
  intervals: OccupancyInterval[],
): OccupancyInterval[] {
  if (!isUnitBookable(unit)) {
    return [
      {
        propertyId: unit.propertyId,
        start: checkIn,
        endExclusive: checkOutExclusive,
        kind: "out_of_service",
        status: unit.status,
      },
    ];
  }
  return intervals.filter(
    (iv) =>
      iv.propertyId === unit.propertyId &&
      intervalOccupies(iv) &&
      rangesOverlap(checkIn, checkOutExclusive, iv.start, iv.endExclusive),
  );
}

export function findAvailableUnits(params: {
  units: InventoryUnit[];
  intervals: OccupancyInterval[];
  checkIn: string;
  checkOut: string;
  roomTypeId?: string | null;
  guests?: number;
}): InventoryUnit[] {
  const { units, intervals, checkIn, checkOut, roomTypeId, guests } = params;
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];

  return units.filter((u) => {
    if (!isUnitBookable(u)) return false;
    if (roomTypeId && u.roomTypeId && u.roomTypeId !== roomTypeId) return false;
    if (guests != null && u.maxGuests != null && guests > u.maxGuests) {
      return false;
    }
    return unitConflictsWith(u, checkIn, checkOut, intervals).length === 0;
  });
}

export type RoomTypeAvailability = {
  roomTypeId: string;
  availableCount: number;
  totalActive: number;
  units: InventoryUnit[];
};

export function availabilityByRoomType(params: {
  units: InventoryUnit[];
  intervals: OccupancyInterval[];
  checkIn: string;
  checkOut: string;
  guests?: number;
}): RoomTypeAvailability[] {
  const byType = new Map<string, InventoryUnit[]>();
  for (const u of params.units) {
    const key = u.roomTypeId ?? "unknown";
    const list = byType.get(key) ?? [];
    list.push(u);
    byType.set(key, list);
  }

  const out: RoomTypeAvailability[] = [];
  for (const [roomTypeId, typeUnits] of byType) {
    const available = findAvailableUnits({
      units: typeUnits,
      intervals: params.intervals,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      roomTypeId: roomTypeId === "unknown" ? null : roomTypeId,
      guests: params.guests,
    });
    const totalActive = typeUnits.filter(isUnitBookable).length;
    out.push({
      roomTypeId,
      availableCount: available.length,
      totalActive,
      units: available,
    });
  }
  return out;
}

/** True si asignar `propertyId` en [checkIn, checkOut) provocaría overbooking. */
export function wouldDoubleBook(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  intervals: OccupancyInterval[],
  unit?: InventoryUnit,
): boolean {
  if (unit && !isUnitBookable(unit)) return true;
  return intervals.some(
    (iv) =>
      iv.propertyId === propertyId &&
      intervalOccupies(iv) &&
      rangesOverlap(checkIn, checkOut, iv.start, iv.endExclusive),
  );
}

export const HOLD_TTL_MINUTES_DEFAULT = 15;

export function holdExpiresAt(
  from: Date = new Date(),
  ttlMinutes = HOLD_TTL_MINUTES_DEFAULT,
): Date {
  return new Date(from.getTime() + ttlMinutes * 60_000);
}
