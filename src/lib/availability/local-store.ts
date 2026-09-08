/**
 * Store local para evaluación sin Supabase (Fase 3–4).
 * Persistencia durable opcional en `.data/booking.json` (sobrevive reinicio en dev).
 */

import type { OccupancyInterval } from "@/lib/availability/engine";
import { buildSeedCatalog } from "@/lib/catalog/seed";
import type { InventoryUnit } from "@/lib/availability/engine";
import {
  clearJsonFile,
  durableStoreEnabled,
  loadJsonFile,
  saveJsonFile,
} from "@/lib/persist/json-file-store";

export type LocalReservation = {
  id: string;
  reservation_code: string;
  organization_id: string;
  property_id: string;
  /** Multi-unidad / grupo ligero: todas las propiedades ocupadas */
  property_ids?: string[];
  room_id: string | null;
  room_ids?: string[];
  room_type_id: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  lofts?: number;
  price: number | null;
  status: string;
  payment_status: string;
  extras: unknown[];
  source: string;
  channel: string;
  notes: string;
  is_walk_in?: boolean;
  group_id?: string | null;
  corporate_name?: string | null;
  referrer_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type LocalHold = {
  id: string;
  property_id: string;
  room_type_id: string | null;
  check_in: string;
  check_out: string;
  expires_at: string;
  status: string;
};

type BookingSnapshot = {
  reservations: LocalReservation[];
  holds: LocalHold[];
  blocks: OccupancyInterval[];
};

const STORE_NAME = "booking";

const g = globalThis as unknown as {
  __lhLocalReservations?: Map<string, LocalReservation>;
  __lhLocalHolds?: Map<string, LocalHold>;
  __lhLocalBlocks?: OccupancyInterval[];
  __lhBookingHydrated?: boolean;
};

function hydrateIfNeeded() {
  if (g.__lhBookingHydrated) return;
  g.__lhBookingHydrated = true;
  if (!durableStoreEnabled()) return;
  const snap = loadJsonFile<BookingSnapshot>(STORE_NAME);
  if (!snap) return;
  const resMap = new Map<string, LocalReservation>();
  for (const row of snap.reservations ?? []) {
    resMap.set(row.id, row);
    if (row.reservation_code) {
      resMap.set(`code:${row.reservation_code}`, row);
    }
  }
  g.__lhLocalReservations = resMap;
  const holds = new Map<string, LocalHold>();
  for (const h of snap.holds ?? []) holds.set(h.id, h);
  g.__lhLocalHolds = holds;
  g.__lhLocalBlocks = snap.blocks ?? [];
}

function persist() {
  if (!durableStoreEnabled()) return;
  const seen = new Set<string>();
  const reservations: LocalReservation[] = [];
  for (const [k, v] of reservationsMap()) {
    if (k.startsWith("code:")) continue;
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    reservations.push(v);
  }
  saveJsonFile(STORE_NAME, {
    reservations,
    holds: [...holdsMap().values()],
    blocks: blocksList(),
  } satisfies BookingSnapshot);
}

function reservationsMap() {
  hydrateIfNeeded();
  if (!g.__lhLocalReservations) g.__lhLocalReservations = new Map();
  return g.__lhLocalReservations;
}

function holdsMap() {
  hydrateIfNeeded();
  if (!g.__lhLocalHolds) g.__lhLocalHolds = new Map();
  return g.__lhLocalHolds;
}

function blocksList() {
  hydrateIfNeeded();
  if (!g.__lhLocalBlocks) g.__lhLocalBlocks = [];
  return g.__lhLocalBlocks;
}

export function seedInventoryUnits(): InventoryUnit[] {
  const catalog = buildSeedCatalog();
  return catalog.rooms
    .filter((r) => r.status !== "storage")
    .map((r) => ({
      propertyId: r.legacy_property_id ?? r.id,
      roomId: r.id,
      roomTypeId: r.room_type_id,
      unitCode: r.code,
      status: r.status === "maintenance" ? "out_of_service" : r.status,
      maxGuests: r.max_guests,
    }));
}

export function listLocalOccupancy(): OccupancyInterval[] {
  const now = Date.now();
  const holds = [...holdsMap().values()]
    .filter((h) => h.status === "active" && new Date(h.expires_at).getTime() > now)
    .map((h) => ({
      id: h.id,
      propertyId: h.property_id,
      start: h.check_in,
      endExclusive: h.check_out,
      kind: "hold" as const,
      status: "active",
    }));

  const res = [...reservationsMap().values()]
    .filter((r) => r.status !== "cancelled")
    .flatMap((r) => {
      const props =
        r.property_ids && r.property_ids.length > 0
          ? r.property_ids
          : [r.property_id];
      return props.map((propertyId, idx) => ({
        id: idx === 0 ? r.id : `${r.id}:${propertyId}`,
        propertyId,
        start: r.check_in,
        endExclusive: r.check_out,
        kind: "reservation" as const,
        status: r.status,
      }));
    });

  return [...blocksList(), ...holds, ...res];
}

export function upsertLocalReservation(row: LocalReservation) {
  reservationsMap().set(row.id, row);
  if (row.reservation_code) {
    reservationsMap().set(`code:${row.reservation_code}`, row);
  }
  persist();
}

export function getLocalReservationByCode(code: string): LocalReservation | null {
  return reservationsMap().get(`code:${code}`) ?? null;
}

export function getLocalReservationById(id: string): LocalReservation | null {
  return reservationsMap().get(id) ?? null;
}

export function listLocalReservations(): LocalReservation[] {
  const seen = new Set<string>();
  const out: LocalReservation[] = [];
  for (const [k, v] of reservationsMap()) {
    if (k.startsWith("code:")) continue;
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

export function addLocalHold(hold: LocalHold) {
  holdsMap().set(hold.id, hold);
  persist();
}

export function consumeLocalHold(id: string) {
  const h = holdsMap().get(id);
  if (h) {
    h.status = "consumed";
    holdsMap().set(id, h);
    persist();
  }
}

export function addLocalBlock(interval: OccupancyInterval) {
  blocksList().push(interval);
  persist();
}

export function resetLocalBookingStore() {
  reservationsMap().clear();
  holdsMap().clear();
  g.__lhLocalBlocks = [];
  clearJsonFile(STORE_NAME);
}
