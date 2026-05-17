// =============================================================================
// Rate limiting ligero para /api/admin/* (Edge middleware).
// Ventana fija por IP; en varias réplicas cada una tiene su contador (aprox.).
//
// ADMIN_API_RATE_LIMIT_PER_MINUTE — default 240 (ajústalo en overload real).
// =============================================================================

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 240;

type Bucket = { resetAt: number; count: number };

const buckets = new Map<string, Bucket>();

function maxPerWindow(): number {
  const n = Number(process.env.ADMIN_API_RATE_LIMIT_PER_MINUTE);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX;
}

function prune(now: number): void {
  if (buckets.size < 4000) return;
  for (const [k, v] of buckets) {
    if (now > v.resetAt + WINDOW_MS) buckets.delete(k);
  }
}

/**
 * @returns true si la solicitud puede continuar.
 */
export function allowAdminApiRequest(ipKey: string): boolean {
  const now = Date.now();
  prune(now);
  const max = maxPerWindow();
  const b = buckets.get(ipKey);
  if (!b || now > b.resetAt) {
    buckets.set(ipKey, { resetAt: now + WINDOW_MS, count: 1 });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export function adminApiClientKey(req: {
  headers: Headers;
}): string {
  const xf = req.headers.get("x-forwarded-for");
  const ip =
    xf?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `admin:${ip}`;
}
