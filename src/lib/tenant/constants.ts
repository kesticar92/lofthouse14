/**
 * Constantes del tenant seed Fase 1 (LOFTHOUSE).
 * Deben coincidir con supabase/migrations/017–019.
 */

export const LOFTHOUSE_ORGANIZATION_ID =
  "11111111-1111-4111-8111-111111111111" as const;

export const LOFTHOUSE_ORGANIZATION_SLUG = "lofthouse" as const;

/** Property SaaS (edificio) — tabla `org_properties`. */
export const LOFTHOUSE_PROPERTY_ID =
  "22222222-2222-4222-8222-222222222222" as const;

export const LOFTHOUSE_PROPERTY_SLUG = "lofthouse-14" as const;

export const ORG_MEMBER_ROLES = [
  "org_admin",
  "property_admin",
  "staff",
] as const;

export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

export function isOrgMemberRole(r: string | undefined): r is OrgMemberRole {
  return !!r && (ORG_MEMBER_ROLES as readonly string[]).includes(r);
}
