/**
 * Notificaciones operativas locales (sin Supabase).
 * Usadas por inventario low-stock y otros stubs.
 */

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

const g = globalThis as unknown as {
  __lhLocalOpsNotifications?: LocalOpsNotification[];
};

function store(): LocalOpsNotification[] {
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
  return true;
}

export function resetLocalOpsNotifications() {
  g.__lhLocalOpsNotifications = [];
}
