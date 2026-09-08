// =============================================================================
// Rate limiting ligero para APIs (Edge middleware).
// Ventana fija por IP; en varias réplicas cada una tiene su contador (aprox.).
//
// ADMIN_API_RATE_LIMIT_PER_MINUTE — default 240
// PUBLIC_API_RATE_LIMIT_PER_MINUTE — default 60 (booking / availability)
// =============================================================================

const WINDOW_MS = 60_000;
const DEFAULT_ADMIN_MAX = 240;
/** Público más estricto (booking / availability / messages / fx). */
const DEFAULT_PUBLIC_MAX = 45;

type Bucket = { resetAt: number; count: number };

const buckets = new Map<string, Bucket>();

function envMax(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
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
export function allowRequest(bucketKey: string, max: number): boolean {
  const now = Date.now();
  prune(now);
  const b = buckets.get(bucketKey);
  if (!b || now > b.resetAt) {
    buckets.set(bucketKey, { resetAt: now + WINDOW_MS, count: 1 });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export function allowAdminApiRequest(ipKey: string): boolean {
  return allowRequest(ipKey, envMax("ADMIN_API_RATE_LIMIT_PER_MINUTE", DEFAULT_ADMIN_MAX));
}

export function allowPublicApiRequest(ipKey: string): boolean {
  return allowRequest(
    ipKey,
    envMax("PUBLIC_API_RATE_LIMIT_PER_MINUTE", DEFAULT_PUBLIC_MAX),
  );
}

export function clientIpKey(
  req: { headers: Headers },
  prefix: string,
): string {
  const xf = req.headers.get("x-forwarded-for");
  const ip =
    xf?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${prefix}:${ip}`;
}

export function adminApiClientKey(req: { headers: Headers }): string {
  return clientIpKey(req, "admin");
}

export function publicApiClientKey(req: { headers: Headers }): string {
  return clientIpKey(req, "public");
}

/** Solo tests — vacía buckets en memoria. */
export function __resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
