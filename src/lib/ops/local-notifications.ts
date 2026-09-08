/**
 * Notificaciones operativas locales (sin Supabase).
 * Persistencia durable: `.data/notifications.json`.
 */

import {
  clearJsonFile,
  durableStoreEnabled,
  loadJsonFile,
  saveJsonFile,
} from "@/lib/persist/json-file-store";

export type LocalOpsNotification = {
  id: string;
  title: string;
  message: string;
  level: "info" | "warn" | "critical";
  href?: string;
  created_at: string;
  read: boolean;
  source: string;
};

type NotifSnapshot = { notifications: LocalOpsNotification[] };

const STORE_NAME = "notifications";

const g = globalThis as unknown as {
  __lhLocalOpsNotifications?: LocalOpsNotification[];
  __lhNotifHydrated?: boolean;
};

function hydrateIfNeeded() {
  if (g.__lhNotifHydrated) return;
  g.__lhNotifHydrated = true;
  if (!durableStoreEnabled()) return;
  const snap = loadJsonFile<NotifSnapshot>(STORE_NAME);
  if (snap?.notifications) g.__lhLocalOpsNotifications = snap.notifications;
}

function persist() {
  if (!durableStoreEnabled()) return;
  saveJsonFile(STORE_NAME, {
    notifications: store(),
  } satisfies NotifSnapshot);
}

function store(): LocalOpsNotification[] {
  hydrateIfNeeded();
  if (!g.__lhLocalOpsNotifications) g.__lhLocalOpsNotifications = [];
  return g.__lhLocalOpsNotifications;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pushLocalOpsNotification(
  input: Omit<LocalOpsNotification, "id" | "created_at" | "read"> & {
    id?: string;
    read?: boolean;
  },
): LocalOpsNotification {
  const row: LocalOpsNotification = {
    id: input.id ?? newId(),
    title: input.title,
    message: input.message,
    level: input.level,
    href: input.href,
    source: input.source,
    created_at: new Date().toISOString(),
    read: input.read ?? false,
  };
  store().unshift(row);
  if (store().length > 200) store().length = 200;
  persist();
  return row;
}

export function listLocalOpsNotifications(opts?: {
  unreadOnly?: boolean;
}): LocalOpsNotification[] {
  const all = store();
  if (opts?.unreadOnly) return all.filter((n) => !n.read);
  return [...all];
}

export function markLocalOpsNotificationRead(id: string): boolean {
  const n = store().find((x) => x.id === id);
  if (!n) return false;
  n.read = true;
  persist();
  return true;
}

export function markAllLocalOpsNotificationsRead(): number {
  let n = 0;
  for (const row of store()) {
    if (!row.read) {
      row.read = true;
      n += 1;
    }
  }
  if (n) persist();
  return n;
}

export function resetLocalOpsNotifications() {
  g.__lhLocalOpsNotifications = [];
  clearJsonFile(STORE_NAME);
}
