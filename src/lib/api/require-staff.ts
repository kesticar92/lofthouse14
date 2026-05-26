import {
  createSupabaseServerClient,
  type TypedSupabaseServerClient,
} from "@/lib/supabase/server";
import { isStaffRole, type StaffRole } from "@/lib/supabase/env";
import { apiErr, apiForbidden, apiUnauthorized } from "@/lib/api/response";
import {
  staffHasModuleAccess,
  type AdminModuleKey,
} from "@/lib/api/admin-modules";
import type { User } from "@supabase/supabase-js";

export type StaffProfile = {
  role: StaffRole;
  status: "pending" | "active" | "suspended";
  allowed_modules: string[];
};

export type StaffContext = {
  supabase: TypedSupabaseServerClient;
  user: User;
  profile: StaffProfile;
};

/** Admin y super_admin tienen acceso a todos los módulos vía API (como en el cliente). */
export function staffHasModule(
  profile: StaffProfile,
  module: AdminModuleKey,
): boolean {
  return staffHasModuleAccess(profile, module);
}

/**
 * Devuelve `Response` 403 si el staff no tiene el módulo; si OK devuelve `null`.
 */
export function enforceStaffModule(
  ctx: StaffContext,
  module: AdminModuleKey,
): Response | null {
  if (!staffHasModule(ctx.profile, module)) {
    return apiErr("Sin permiso para este módulo", {
      status: 403,
      code: "FORBIDDEN_MODULE",
    });
  }
  return null;
}

export async function requireStaff(): Promise<
  { ok: true; ctx: StaffContext } | { ok: false; response: Response }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, response: apiUnauthorized() };
  }
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role, status, allowed_modules")
    .eq("id", user.id)
    .maybeSingle();
  if (profErr || !profile || !isStaffRole(profile.role)) {
    return { ok: false, response: apiForbidden() };
  }

  const status = profile.status as StaffProfile["status"];
  if (status !== "active") {
    const msg =
      status === "pending"
        ? "Cuenta pendiente de aprobación"
        : "Cuenta suspendida";
    return {
      ok: false,
      response: apiErr(msg, {
        status: 403,
        code: "FORBIDDEN_ACCOUNT_STATUS",
      }),
    };
  }

  return {
    ok: true,
    ctx: {
      supabase,
      user,
      profile: {
        role: profile.role,
        status,
        allowed_modules: Array.isArray(profile.allowed_modules)
          ? profile.allowed_modules
          : [],
      },
    },
  };
}
