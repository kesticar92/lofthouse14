import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export type StaffContext = {
  supabase: SupabaseClient;
  user: User;
};

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
      response: Response.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profErr || !isStaffRole(profile?.role)) {
    return {
      ok: false,
      response: Response.json({ error: "Prohibido" }, { status: 403 }),
    };
  }
  return { ok: true, ctx: { supabase, user } };
}
