import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaffRole, type StaffRole } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

import { apiErr } from "@/lib/api/response";
import {
  staffHasModuleAccess,
  type AdminModuleKey,
} from "@/lib/api/admin-modules";

export type StaffProfile = {
  role: StaffRole;
  status: string;
  allowed_modules: string[];
};

export type StaffContext = {
  supabase: SupabaseClient;
  user: User;
  profile: StaffProfile;
};

export function staffHasModule(
  profile: StaffProfile,
  moduleKey: AdminModuleKey,
): boolean {
  return staffHasModuleAccess(profile, moduleKey);
}

/** `null` si hay permiso; Response 403 si el módulo no está permitido. */
export function enforceStaffModule(
  ctx: StaffContext,
  moduleKey: AdminModuleKey,
): Response | null {
  if (staffHasModule(ctx.profile, moduleKey)) return null;
  return apiErr("No tienes permiso para este módulo", {
    status: 403,
    code: "FORBIDDEN_MODULE",
  });
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
    return {
      ok: false,
      response: apiErr("No autorizado", { status: 401, code: "UNAUTHORIZED" }),
    };
  }

  const { data: profileRow, error: profErr } = await supabase
    .from("profiles")
    .select("role, status, allowed_modules")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profileRow || !isStaffRole(profileRow.role)) {
    return {
      ok: false,
      response: apiErr("Prohibido", { status: 403, code: "FORBIDDEN" }),
    };
  }

  const status =
    typeof profileRow.status === "string" && profileRow.status
      ? profileRow.status
      : "active";

  if (status === "pending") {
    return {
      ok: false,
      response: apiErr("Tu cuenta está pendiente de aprobación", {
        status: 403,
        code: "FORBIDDEN_ACCOUNT_STATUS",
      }),
    };
  }

  if (status === "suspended") {
    return {
      ok: false,
      response: apiErr("Tu cuenta está suspendida", {
        status: 403,
        code: "FORBIDDEN_ACCOUNT_STATUS",
      }),
    };
  }

  const allowed = Array.isArray(profileRow.allowed_modules)
    ? profileRow.allowed_modules.filter(
        (m): m is string => typeof m === "string",
      )
    : [];

  const profile: StaffProfile = {
    role: profileRow.role,
    status,
    allowed_modules: allowed,
  };

  return { ok: true, ctx: { supabase, user, profile } };
}
