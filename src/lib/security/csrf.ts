/**
 * CSRF hardening: Origin / Referer allowlist en mutaciones.
 *
 * Env:
 * - CSRF_ALLOWED_ORIGINS=https://lofthouse14.com,http://127.0.0.1:43127
 * - CSRF_ORIGIN_CHECK=0  → desactivar
 * - CSRF_STRICT=1        → rechazar si faltan Origin y Referer
 */

function defaultAllowedOrigins(): string[] {
  const out = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      out.add(new URL(site).origin);
    } catch {
      /* ignore */
    }
  }
  for (const host of ["127.0.0.1", "localhost", "0.0.0.0"]) {
    for (const port of ["3000", "43127"]) {
      out.add(`http://${host}:${port}`);
      out.add(`https://${host}:${port}`);
    }
  }
  const extra = process.env.CSRF_ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const s = part.trim();
      if (!s) continue;
      try {
        out.add(new URL(s).origin);
      } catch {
        out.add(s.replace(/\/$/, ""));
      }
    }
  }
  return [...out];
}

export function csrfAllowedOrigins(): string[] {
  return defaultAllowedOrigins();
}

function originAllowed(candidate: string, allowed: string[]): boolean {
  const c = candidate.replace(/\/$/, "").toLowerCase();
  return allowed.some((a) => a.replace(/\/$/, "").toLowerCase() === c);
}

export type CsrfCheckResult =
  | { ok: true }
  | { ok: false; status: 403; error: string; code: "CSRF" };

/**
 * Comprueba Origin (preferido) o Referer contra allowlist.
 * Sin ambos headers: OK salvo CSRF_STRICT=1 (smoke/curl en dev).
 */
export function checkCsrfOrigin(req: Request): CsrfCheckResult {
  if (process.env.CSRF_ORIGIN_CHECK === "0") return { ok: true };

  const method = (req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { ok: true };
  }

  const allowed = csrfAllowedOrigins();
  const origin = req.headers.get("origin")?.trim();
  if (origin) {
    if (originAllowed(origin, allowed)) return { ok: true };
    return {
      ok: false,
      status: 403,
      error: "Origen no permitido (CSRF)",
      code: "CSRF",
    };
  }

  const referer = req.headers.get("referer")?.trim();
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (originAllowed(refOrigin, allowed)) return { ok: true };
    } catch {
      /* fall through */
    }
    return {
      ok: false,
      status: 403,
      error: "Referer no permitido (CSRF)",
      code: "CSRF",
    };
  }

  if (process.env.CSRF_STRICT === "1") {
    return {
      ok: false,
      status: 403,
      error: "Falta Origin/Referer (CSRF_STRICT)",
      code: "CSRF",
    };
  }
  return { ok: true };
}

export function csrfRejectedResponse(result: Extract<CsrfCheckResult, { ok: false }>) {
  return Response.json(
    { error: result.error, code: result.code },
    { status: result.status },
  );
}

/** True si el path debe aplicar CSRF en mutaciones. */
export function pathNeedsCsrf(pathname: string): boolean {
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/public/booking")) return true;
  return false;
}
