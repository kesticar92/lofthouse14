/**
 * Cookie de organización activa (switcher multi-tenant).
 * Solo se honra si el usuario es miembro activo de esa org.
 */

export const ACTIVE_ORG_COOKIE = "lh_active_org";

export const ACTIVE_ORG_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 180; // 180 días

export function parseActiveOrgCookie(
  value: string | undefined | null,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  // UUID v4-ish (acepta el seed fijo 1111…)
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  return trimmed;
}
