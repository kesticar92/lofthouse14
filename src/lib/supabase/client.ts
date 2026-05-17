"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { supabasePublicEnv } from "./env";

export type TypedSupabaseClient = SupabaseClient<Database>;

export function getSupabaseBrowser(): TypedSupabaseClient | null {
  const { url, key, ok } = supabasePublicEnv();
  if (!ok) return null;
  return createBrowserClient<Database>(url, key);
}
