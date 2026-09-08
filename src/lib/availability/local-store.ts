/**
 * Store local en memoria para evaluación sin Supabase (Fase 3–4).
 * No persiste entre reinicios de proceso — marcado como mock.
 */

import type { OccupancyInterval } from "@/lib/availability/engine";
import { buildSeedCatalog } from "@/lib/catalog/seed";
import type { InventoryUnit } from "@/lib/availability/engine";

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

const g = globalThis as unknown as {
  __lhLocalReservations?: Map<string, LocalReservation>;
  __lhLocalHolds?: Map<string, LocalHold>;
  __lhLocalBlocks?: OccupancyInterval[];
};

function reservationsMap() {
  if (!g.__lhLocalReservations) g.__lhLocalReservations = new Map();
  return g.__lhLocalReservations;
}

function holdsMap() {
  if (!g.__lhLocalHolds) g.__lhLocalHolds = new Map();
  return g.__lhLocalHolds;
}

function blocksList() {
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
}

export function getLocalReservationByCode(code: string): LocalReservation | null {
  return reservationsMap().get(`code:${code}`) ?? null;
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
}

export function consumeLocalHold(id: string) {
  const h = holdsMap().get(id);
  if (h) {
    h.status = "consumed";
    holdsMap().set(id, h);
  }
}

export function addLocalBlock(interval: OccupancyInterval) {
  blocksList().push(interval);
}

export function resetLocalBookingStore() {
  reservationsMap().clear();
  holdsMap().clear();
  g.__lhLocalBlocks = [];
}
