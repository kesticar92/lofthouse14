/**
 * Detecta fallos de red/DNS hacia Supabase (Auth, PostgREST, etc.).
 * Útil en middleware y cliente para no romper la app ni ocultar el caso “sin red”.
 */
export function isSupabaseAuthUnreachable(err: unknown): boolean {
  if (err == null) return false;
  const e = err as {
    name?: string;
    message?: string;
    cause?: unknown;
    __isAuthError?: boolean;
  };
  const name = String(e.name ?? "");
  const msg = String(e.message ?? "");

  if (name === "AuthRetryableFetchError") return true;
  if (name === "TypeError" && msg.includes("fetch failed")) return true;
  if (msg.includes("fetch failed")) return true;
  if (msg.includes("ENOTFOUND")) return true;
  if (msg.includes("ECONNREFUSED")) return true;
  if (msg.includes("ETIMEDOUT")) return true;
  if (msg.includes("EAI_AGAIN")) return true;
  if (msg.includes("network error")) return true;

  if (e.cause !== undefined && isSupabaseAuthUnreachable(e.cause)) return true;
  return false;
}
