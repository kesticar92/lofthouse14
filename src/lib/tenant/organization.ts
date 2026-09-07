import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffRole } from "@/lib/supabase/env";
import { apiErr } from "@/lib/api/response";
import {
  LOFTHOUSE_ORGANIZATION_ID,
  LOFTHOUSE_ORGANIZATION_SLUG,
  type OrgMemberRole,
} from "@/lib/tenant/constants";

/** Mapeo profiles.app_role → org_members.role (seed / invitaciones). */
export function mapAppRoleToOrgMemberRole(role: StaffRole): OrgMemberRole {
  if (role === "super_admin") return "org_admin";
  if (role === "admin") return "property_admin";
  return "staff";
}

/**
 * Org preferida desde env (sin secretos).
 * `DEFAULT_ORGANIZATION_ID` gana sobre slug.
 */
export function configuredOrganizationId(): string | null {
  const id = process.env.DEFAULT_ORGANIZATION_ID?.trim();
  if (id) return id;
  return null;
}

export function configuredOrganizationSlug(): string {
  return (
    process.env.DEFAULT_ORGANIZATION_SLUG?.trim() ||
    LOFTHOUSE_ORGANIZATION_SLUG
  );
}

/**
 * Resuelve la organización activa del staff.
 * Prioridad:
 * 1. Cookie / header de switcher (`preferredOrganizationId`) si es miembro.
 * 2. Env `DEFAULT_ORGANIZATION_ID` / slug seed si es miembro.
 * 3. Primera membership activa.
 * 4. `super_admin` sin membership → seed LOFTHOUSE (plataforma).
 * 5. Staff sin membership → `null` (RLS no devolverá filas).
 */
export async function resolveStaffOrganizationId(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    role: StaffRole;
    /** Preferencia del switcher (cookie `lh_active_org`). */
    preferredOrganizationId?: string | null;
  },
): Promise<string | null> {
  const envPreferredId = configuredOrganizationId();
  const preferredSlug = configuredOrganizationSlug();
  const switcherId = opts.preferredOrganizationId?.trim() || null;

  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("organization_id, role, status")
    .eq("user_id", opts.userId)
    .eq("status", "active");

  if (!error && memberships && memberships.length > 0) {
    if (switcherId) {
      const hit = memberships.find((m) => m.organization_id === switcherId);
      if (hit) return hit.organization_id;
    }

    if (envPreferredId) {
      const hit = memberships.find((m) => m.organization_id === envPreferredId);
      if (hit) return hit.organization_id;
    }

    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, slug")
      .in(
        "id",
        memberships.map((m) => m.organization_id),
      );

    const bySlug = (orgs ?? []).find((o) => o.slug === preferredSlug);
    if (bySlug) return bySlug.id;

    return memberships[0]!.organization_id;
  }

  // Tabla aún no migrada / error: no romper admin en entornos sin 017.
  if (error) {
    if (opts.role === "super_admin") {
      return switcherId ?? envPreferredId ?? LOFTHOUSE_ORGANIZATION_ID;
    }
    return switcherId ?? envPreferredId;
  }

  if (opts.role === "super_admin") {
    return switcherId ?? envPreferredId ?? LOFTHOUSE_ORGANIZATION_ID;
  }

  return null;
}

/** 403 si el staff no tiene organización activa (salvo que se permita null). */
export function enforceOrganizationId(
  organizationId: string | null,
): Response | null {
  if (organizationId) return null;
  return apiErr("Sin organización activa. Contacta a un administrador.", {
    status: 403,
    code: "FORBIDDEN_NO_ORG",
  });
}
