"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "./env";

export function getSupabaseBrowser(): SupabaseClient | null {
  const { url, key, ok } = supabasePublicEnv();
  if (!ok) return null;
  return createBrowserClient(url, key);
}
