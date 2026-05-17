// Wrapper retro-compatible sobre `src/lib/env.ts` para no romper imports
// existentes. La validación real (zod) vive en el módulo central.
//
// Para nuevo código, prefiere:
//   import { publicEnv, hasSupabaseConfig } from "@/lib/env";

import { publicEnv, hasSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database.types";

/** URL y clave pública (anon o publishable `sb_publishable_…`). */
export function supabasePublicEnv(): {
  url: string;
  key: string;
  ok: boolean;
} {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  return { url, key, ok: hasSupabaseConfig() };
}

export const STAFF_ROLES = ["super_admin", "admin", "staff"] as const;

export type StaffRole = Database["public"]["Enums"]["app_role"];

export function isStaffRole(r: string | null | undefined): r is StaffRole {
  return !!r && (STAFF_ROLES as readonly string[]).includes(r);
}
