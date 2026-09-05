import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";

/** Cliente Supabase en servidor (RSC, route handlers, server actions). */
export async function createSupabaseServerClient() {
  const { url, key, ok } = supabasePublicEnv();
  if (!ok) {
    throw new Error("Supabase no está configurado en el servidor.");
  }
  const cookieStore = await cookies();

  return createServerClient(url, key, {
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
