import { cookies } from "next/headers";
import { z } from "zod";

import { requireStaff } from "@/lib/api/require-staff";
import { apiBadRequest, apiErr, apiValidationError } from "@/lib/api/response";
import {
  ACTIVE_ORG_COOKIE,
  ACTIVE_ORG_COOKIE_MAX_AGE_SEC,
  parseActiveOrgCookie,
} from "@/lib/tenant/active-org-cookie";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

/** Lista organizaciones del staff (para switcher). */
export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user, organizationId, profile } = gate.ctx;

  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    // Pre-migración / sin tablas: devolver seed.
    return Response.json({
      active_organization_id:
        organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
      organizations: [
        {
          id: LOFTHOUSE_ORGANIZATION_ID,
          slug: "lofthouse",
          name: "LOFTHOUSE",
          role: profile.role === "super_admin" ? "org_admin" : "staff",
          status: "active",
        },
      ],
      source: "seed",
    });
  }

  const ids = (memberships ?? []).map((m) => m.organization_id);
  let orgs: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
  }> = [];

  if (ids.length > 0) {
    const { data, error: orgErr } = await supabase
      .from("organizations")
      .select("id, slug, name, status")
      .in("id", ids)
      .order("name");
    if (orgErr) {
      return Response.json({ error: orgErr.message }, { status: 500 });
    }
    orgs = data ?? [];
  } else if (profile.role === "super_admin") {
    orgs = [
      {
        id: LOFTHOUSE_ORGANIZATION_ID,
        slug: "lofthouse",
        name: "LOFTHOUSE",
        status: "active",
      },
    ];
  }

  const roleByOrg = new Map(
    (memberships ?? []).map((m) => [m.organization_id, m.role]),
  );

  return Response.json({
    active_organization_id: organizationId,
    organizations: orgs.map((o) => ({
      ...o,
      role: roleByOrg.get(o.id) ?? (profile.role === "super_admin" ? "org_admin" : "staff"),
    })),
    source: "database",
  });
}

const setActiveSchema = z.object({
  organization_id: z.string().uuid(),
});

/** Fija la org activa del switcher (cookie httpOnly). */
export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user, profile } = gate.ctx;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiBadRequest("JSON inválido");
  }

  const parsed = setActiveSchema.safeParse(json);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten());
  }

  const orgId = parseActiveOrgCookie(parsed.data.organization_id);
  if (!orgId) {
    return apiBadRequest("organization_id inválido");
  }

  const { data: membership, error } = await supabase
    .from("org_members")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    // Sin tablas: solo permitir seed LOFTHOUSE a super_admin.
    if (
      profile.role === "super_admin" &&
      orgId === LOFTHOUSE_ORGANIZATION_ID
    ) {
      await setActiveOrgCookie(orgId);
      return Response.json({ ok: true, organization_id: orgId, source: "seed" });
    }
    return apiErr(error.message, { status: 500 });
  }

  if (!membership && profile.role !== "super_admin") {
    return apiErr("No eres miembro de esa organización", {
      status: 403,
      code: "FORBIDDEN_ORG",
    });
  }

  if (!membership && profile.role === "super_admin") {
    // Plataforma: permitir seed u orgs existentes.
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .maybeSingle();
    if (!org && orgId !== LOFTHOUSE_ORGANIZATION_ID) {
      return apiErr("Organización no encontrada", {
        status: 404,
        code: "NOT_FOUND",
      });
    }
  }

  await setActiveOrgCookie(orgId);
  return Response.json({ ok: true, organization_id: orgId });
}

async function setActiveOrgCookie(orgId: string) {
  const jar = await cookies();
  jar.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACTIVE_ORG_COOKIE_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}
