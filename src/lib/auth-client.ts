"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isStaffRole } from "@/lib/supabase/env";

export type AdminSessionInfo = {
  user: string;
  role: string;
};

export async function fetchAdminSession(): Promise<AdminSessionInfo | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user?.email) return null;

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile?.role || !isStaffRole(profile.role)) return null;

  return { user: user.email, role: profile.role };
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<"ok" | "bad_credentials" | "network" | "server" | "no_profile"> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) return "server";
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("credentials")
      ) {
        return "bad_credentials";
      }
      return "server";
    }
    if (!data.user) return "server";

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile?.role || !isStaffRole(profile.role)) {
      await supabase.auth.signOut();
      return "no_profile";
    }

    await supabase.from("audit_logs").insert({
      actor_id: data.user.id,
      action: "auth.login",
      entity_type: "auth",
      metadata: { email: data.user.email },
    });

    return "ok";
  } catch {
    return "network";
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "auth.logout",
        entity_type: "auth",
      });
    }
    await supabase.auth.signOut();
  } catch {
    /* sesión ya inválida */
  }
}
