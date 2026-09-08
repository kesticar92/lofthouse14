/**
 * Audit log helper (local + best-effort Supabase).
 * Usar en walk-in / cancel / pay sin filtrar PII completa a consola en prod.
 */

export type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  actor?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
};

const g = globalThis as unknown as {
  __lhAuditLog?: AuditEntry[];
};

function store(): AuditEntry[] {
  if (!g.__lhAuditLog) g.__lhAuditLog = [];
  return g.__lhAuditLog;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `aud-${crypto.randomUUID()}`;
  }
  return `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Redacta campos sensibles comunes antes de persistir metadata. */
export function sanitizeAuditMetadata(
  meta?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    const key = k.toLowerCase();
    if (
      key.includes("password") ||
      key.includes("secret") ||
      key.includes("token") ||
      key.includes("card") ||
      key.includes("cvv")
    ) {
      out[k] = "[redacted]";
      continue;
    }
    if (typeof v === "string" && v.length > 200) {
      out[k] = `${v.slice(0, 200)}…`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function recordLocalAudit(input: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  actor?: string | null;
  metadata?: Record<string, unknown>;
}): AuditEntry {
  const entry: AuditEntry = {
    id: newId(),
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    actor: input.actor ?? null,
    metadata: sanitizeAuditMetadata(input.metadata),
    created_at: new Date().toISOString(),
  };
  store().unshift(entry);
  if (store().length > 500) store().length = 500;
  return entry;
}

export function listLocalAudit(limit = 50): AuditEntry[] {
  return store().slice(0, Math.max(1, limit));
}

export function resetLocalAudit() {
  g.__lhAuditLog = [];
}
