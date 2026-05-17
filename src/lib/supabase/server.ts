import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { supabasePublicEnv } from "./env";

export type TypedSupabaseServerClient = SupabaseClient<Database>;

/** Cliente Supabase en servidor (RSC, route handlers, server actions). */
export async function createSupabaseServerClient(): Promise<TypedSupabaseServerClient> {
  const { url, key, ok } = supabasePublicEnv();
  if (!ok) {
    throw new Error("Supabase no está configurado en el servidor.");
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* set desde Server Component sin mutar cookies */
        }
      },
    },
  });
}
