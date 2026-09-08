/**
 * Booking engine (Fase 4) — crea reserva con anti-double-booking.
 * Usa motor de availability + store local o Supabase.
 */

import {
  findAvailableUnits,
  wouldDoubleBook,
  type InventoryUnit,
  type OccupancyInterval,
} from "@/lib/availability/engine";
import {
  addLocalHold,
  consumeLocalHold,
  getLocalReservationByCode,
  listLocalOccupancy,
  seedInventoryUnits,
  upsertLocalReservation,
  type LocalReservation,
} from "@/lib/availability/local-store";
import { generateReservationCode } from "@/lib/booking/reservation-code";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { ROOM_TYPE_IDS, type MarketingCategory } from "@/lib/catalog/seed";
import { createLocalPendingPayment } from "@/lib/payments/local-store";
import type { LocalPayment } from "@/lib/payments/local-store";

export type BookingExtra = {
  id: string;
  label: string;
  amountCop?: number;
};

export type CreateBookingInput = {
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  categoryId?: MarketingCategory | null;
  roomTypeId?: string | null;
  lofts?: number;
  /** Preferencias de unidades (property ids) — opcional */
  propertyIds?: string[];
  extras?: BookingExtra[];
  price?: number | null;
  notes?: string;
  source?: string;
  /** Si true, status=pending; si no confirmed */
  pending?: boolean;
  /** Walk-in PMS: llegada inmediata */
  walkIn?: boolean;
};

export type CreateBookingResult =
  | {
      ok: true;
      mode: "local" | "supabase";
      reservation: LocalReservation;
      payment?: LocalPayment;
      whatsappSuggested: boolean;
    }
  | { ok: false; error: string; code?: string };

function resolveRoomTypeId(input: CreateBookingInput): string | null {
  if (input.roomTypeId) return input.roomTypeId;
  if (input.categoryId) return ROOM_TYPE_IDS[input.categoryId];
  return null;
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Crea reserva en store local (sin Supabase).
 * Asigna N unidades disponibles (lofts / grupo ligero).
 */
export function createLocalBooking(input: CreateBookingInput): CreateBookingResult {
  const checkIn = input.checkIn?.trim();
  const checkOut = input.checkOut?.trim();
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return { ok: false, error: "Fechas inválidas", code: "INVALID_DATES" };
  }
  const guests = Math.max(1, Math.floor(input.guests || 1));
  const needed = Math.max(1, Math.floor(input.lofts || 1));
  const roomTypeId = resolveRoomTypeId(input);
  const units = seedInventoryUnits();
  const intervals = listLocalOccupancy();
  /** Capacidad por unidad en grupos ligeros (no exigir todos los huéspedes en 1 loft). */
  const guestsPerUnit = Math.max(1, Math.ceil(guests / needed));
  let available = findAvailableUnits({
    units,
    intervals,
    checkIn,
    checkOut,
    roomTypeId,
    guests: guestsPerUnit,
  });

  if (input.propertyIds?.length) {
    const prefer = new Set(input.propertyIds);
    const preferred = available.filter((u) => prefer.has(u.propertyId));
    const rest = available.filter((u) => !prefer.has(u.propertyId));
    available = [...preferred, ...rest];
  }

  if (available.length < needed) {
    return {
      ok: false,
      error: "No hay disponibilidad para esas fechas / categoría",
      code: "NO_AVAILABILITY",
    };
  }

  const assigned = available.slice(0, needed);
  for (const unit of assigned) {
    if (wouldDoubleBook(unit.propertyId, checkIn, checkOut, intervals, unit)) {
      return { ok: false, error: "Double booking detectado", code: "DOUBLE_BOOKING" };
    }
  }

  const holdIds: string[] = [];
  for (const unit of assigned) {
    const holdId = newId();
    holdIds.push(holdId);
    addLocalHold({
      id: holdId,
      property_id: unit.propertyId,
      room_type_id: roomTypeId,
      check_in: checkIn,
      check_out: checkOut,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      status: "active",
    });
  }

  const primary = assigned[0]!;
  const code = generateReservationCode("LH");
  const now = new Date().toISOString();
  const groupId = needed > 1 ? newId() : null;
  const reservation: LocalReservation = {
    id: newId(),
    reservation_code: code,
    organization_id: LOFTHOUSE_ORGANIZATION_ID,
    property_id: primary.propertyId,
    property_ids: assigned.map((u) => u.propertyId),
    room_id: primary.roomId ?? null,
    room_ids: assigned.map((u) => u.roomId).filter(Boolean) as string[],
    room_type_id: roomTypeId,
    guest_name: input.guestName?.trim() || "Huésped",
    guest_phone: input.guestPhone?.trim() || "",
    guest_email: input.guestEmail?.trim() || "",
    check_in: checkIn,
    check_out: checkOut,
    guests,
    lofts: needed,
    price: input.price ?? null,
    status: input.pending ? "pending" : input.walkIn ? "checked_in" : "confirmed",
    payment_status: "unpaid",
    extras: input.extras ?? [],
    source: input.walkIn ? "walk_in" : (input.source ?? "lofthouse14.com"),
    channel: input.walkIn ? "walk_in" : "direct",
    notes: input.notes?.trim() || "",
    is_walk_in: Boolean(input.walkIn),
    group_id: groupId,
    created_at: now,
    updated_at: now,
  };

  upsertLocalReservation(reservation);
  for (const hid of holdIds) consumeLocalHold(hid);

  const payment =
    reservation.price != null && reservation.price > 0
      ? createLocalPendingPayment({
          organizationId: LOFTHOUSE_ORGANIZATION_ID,
          reservationId: reservation.id,
          reservationCode: reservation.reservation_code,
          amount: reservation.price,
          provider: "stub",
          metadata: {
            source: reservation.source,
            lofts: needed,
            walk_in: Boolean(input.walkIn),
          },
        })
      : undefined;

  if (payment) {
    reservation.payment_status = "pending";
    upsertLocalReservation(reservation);
  }

  return {
    ok: true,
    mode: "local",
    reservation,
    payment,
    whatsappSuggested: !input.walkIn,
  };
}

export function lookupLocalBooking(code: string): LocalReservation | null {
  return getLocalReservationByCode(code.trim().toUpperCase());
}

/** Construye intervals desde filas DB genéricas. */
export function intervalsFromDbRows(params: {
  reservations: Array<{
    id: string;
    property_id: string;
    check_in: string;
    check_out: string;
    status: string;
  }>;
  blocks: Array<{
    id: string;
    property_id: string;
    start_date: string;
    end_date: string;
  }>;
  holds?: Array<{
    id: string;
    property_id: string;
    check_in: string;
    check_out: string;
    status: string;
    expires_at: string;
  }>;
}): OccupancyInterval[] {
  const now = Date.now();
  const res: OccupancyInterval[] = params.reservations.map((r) => ({
    id: r.id,
    propertyId: r.property_id,
    start: r.check_in,
    endExclusive: r.check_out,
    kind: "reservation",
    status: r.status,
  }));
  const blocks: OccupancyInterval[] = params.blocks.map((b) => ({
    id: b.id,
    propertyId: b.property_id,
    start: b.start_date,
    endExclusive: b.end_date,
    kind: "block",
    status: "active",
  }));
  const holds: OccupancyInterval[] = (params.holds ?? [])
    .filter(
      (h) =>
        h.status === "active" && new Date(h.expires_at).getTime() > now,
    )
    .map((h) => ({
      id: h.id,
      propertyId: h.property_id,
      start: h.check_in,
      endExclusive: h.check_out,
      kind: "hold",
      status: "active",
    }));
  return [...res, ...blocks, ...holds];
}

export function unitsFromCatalogRows(
  rooms: Array<{
    id: string;
    room_type_id: string | null;
    legacy_property_id: string | null;
    code: string;
    status: string;
    max_guests: number;
  }>,
): InventoryUnit[] {
  return rooms
    .filter((r) => r.status !== "storage")
    .map((r) => ({
      propertyId: r.legacy_property_id ?? r.id,
      roomId: r.id,
      roomTypeId: r.room_type_id,
      unitCode: r.code,
      status:
        r.status === "maintenance" || r.status === "out_of_service"
          ? "out_of_service"
          : (r.status as InventoryUnit["status"]),
      maxGuests: r.max_guests,
    }));
}
