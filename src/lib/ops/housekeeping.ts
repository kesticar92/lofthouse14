/**
 * Housekeeping tasks locales — auto dirty al checkout.
 * Persistencia durable: `.data/housekeeping.json`.
 */

import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import type { HkStatus } from "@/lib/ops/maintenance";
import {
  clearJsonFile,
  durableStoreEnabled,
  loadJsonFile,
  saveJsonFile,
} from "@/lib/persist/json-file-store";

export type HousekeepingTask = {
  id: string;
  organization_id: string;
  reservation_code: string | null;
  property_id: string | null;
  room_id: string | null;
  status: HkStatus;
  source: "checkout_auto" | "manual" | "api";
  title: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

type HkSnapshot = { tasks: HousekeepingTask[] };

const STORE_NAME = "housekeeping";

const g = globalThis as unknown as {
  __lhHousekeeping?: HousekeepingTask[];
  __lhHkHydrated?: boolean;
};

function hydrateIfNeeded() {
  if (g.__lhHkHydrated) return;
  g.__lhHkHydrated = true;
  if (!durableStoreEnabled()) return;
  const snap = loadJsonFile<HkSnapshot>(STORE_NAME);
  if (snap?.tasks) g.__lhHousekeeping = snap.tasks;
}

function persist() {
  if (!durableStoreEnabled()) return;
  saveJsonFile(STORE_NAME, { tasks: store() } satisfies HkSnapshot);
}

function store(): HousekeepingTask[] {
  hydrateIfNeeded();
  if (!g.__lhHousekeeping) g.__lhHousekeeping = [];
  return g.__lhHousekeeping;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `hk-${crypto.randomUUID()}`;
  }
  return `hk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDirtyTaskOnCheckout(input: {
  reservationCode: string;
  propertyId?: string | null;
  roomId?: string | null;
  organizationId?: string;
}): HousekeepingTask {
  const code = input.reservationCode.trim().toUpperCase();
  const existing = store().find(
    (t) =>
      t.reservation_code === code &&
      t.source === "checkout_auto" &&
      t.status === "dirty",
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const task: HousekeepingTask = {
    id: newId(),
    organization_id: input.organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
    reservation_code: code,
    property_id: input.propertyId ?? null,
    room_id: input.roomId ?? null,
    status: "dirty",
    source: "checkout_auto",
    title: `Dirty post check-out ${code}`,
    notes: "Creada automáticamente al marcar checked_out",
    created_at: now,
    updated_at: now,
  };
  store().unshift(task);
  persist();
  return task;
}

export function listHousekeepingTasks(filter?: {
  status?: HkStatus;
  reservationCode?: string;
}): HousekeepingTask[] {
  let rows = [...store()];
  if (filter?.status) {
    rows = rows.filter((t) => t.status === filter.status);
  }
  if (filter?.reservationCode) {
    const c = filter.reservationCode.trim().toUpperCase();
    rows = rows.filter((t) => t.reservation_code === c);
  }
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function updateHousekeepingStatus(
  id: string,
  status: HkStatus,
): HousekeepingTask | null {
  const t = store().find((x) => x.id === id);
  if (!t) return null;
  t.status = status;
  t.updated_at = new Date().toISOString();
  persist();
  return t;
}

export function resetHousekeepingTasks() {
  g.__lhHousekeeping = [];
  clearJsonFile(STORE_NAME);
}
