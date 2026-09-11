"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isStaffRole, supabasePublicEnv } from "@/lib/supabase/env";

export type AdminSessionInfo = {
  user: string;
  role: string;
  mode?: "local" | "supabase";
};

export type LoginAdminResult =
  | "ok"
  | "bad_credentials"
  | "network"
  | "server"
  | "no_profile";

async function fetchLocalSession(): Promise<AdminSessionInfo | null> {
  try {
    const res = await fetch("/api/admin/local-auth", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      ok?: boolean;
      user?: string;
      role?: string;
    };
    if (!json.ok || !json.user) return null;
    return {
      user: json.user,
      role: json.role ?? "super_admin",
      mode: "local",
    };
  } catch {
    return null;
  }
}

export async function fetchAdminSession(): Promise<AdminSessionInfo | null> {
  const local = await fetchLocalSession();
  if (local) return local;

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

  return { user: user.email, role: profile.role, mode: "supabase" };
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginAdminResult> {
  if (!supabasePublicEnv().ok) {
    try {
      const res = await fetch("/api/admin/local-auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) return "bad_credentials";
      if (!res.ok) return "server";
      return "ok";
    } catch {
      return "network";
    }
  }

  try {
    const supabase = getSupabaseBrowser();
    if (!supabase) return "server";
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid") || msg.includes("credentials")) {
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
    await fetch("/api/admin/local-auth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
  } catch {
    /* ignore */
  }
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
