"use client";

import { ADMIN_MODULE_KEYS } from "@/lib/api/admin-modules";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseAuthUnreachable } from "@/lib/supabase/auth-errors";
import { isStaffRole } from "@/lib/supabase/env";

export type AdminSessionInfo = {
  user: string;
  userId: string;
  role: string;
  status: string;
  allowedModules: string[];
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
    .select("role, status, allowed_modules")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile?.role || !isStaffRole(profile.role)) return null;
  if (profile.status !== "active") return null;

  const isSuperAdmin = profile.role === "super_admin";
  const isAdmin = profile.role === "admin";

  return {
    user: user.email,
    userId: user.id,
    role: profile.role,
    status: profile.status,
    allowedModules: isSuperAdmin || isAdmin ? [...ADMIN_MODULE_KEYS] : (profile.allowed_modules ?? []),
  };
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<"ok" | "bad_credentials" | "network" | "server" | "no_profile" | "pending_approval" | "suspended"> {
  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) return "server";
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      if (isSupabaseAuthUnreachable(error)) return "network";
      // Log real Supabase error for debugging (visible en DevTools)
      console.error("[loginAdmin] Supabase auth error:", error.status, error.message, error.code);
      const msg = error.message.toLowerCase();
      if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid credentials") ||
        msg.includes("email not confirmed") ||
        msg.includes("invalid email or password") ||
        (error.status === 400 && (msg.includes("invalid") || msg.includes("credentials")))
      ) {
        return "bad_credentials";
      }
      return "server";
    }
    if (!data.user) return "server";

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profErr) {
      if (isSupabaseAuthUnreachable(profErr)) return "network";
      console.error("[loginAdmin] Error leyendo profiles:", profErr.message, profErr);
    }

    if (!profile?.role || !isStaffRole(profile.role)) {
      await supabase.auth.signOut();
      return "no_profile";
    }

    if (profile.status === "pending") {
      await supabase.auth.signOut();
      return "pending_approval";
    }

    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      return "suspended";
    }

    await supabase.from("audit_logs").insert({
      actor_id: data.user.id,
      action: "auth.login",
      entity_type: "auth",
      metadata: { email: data.user.email },
    });

    return "ok";
  } catch (err) {
    if (isSupabaseAuthUnreachable(err)) return "network";
    console.error("[loginAdmin] excepción no manejada:", err);
    return "server";
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
