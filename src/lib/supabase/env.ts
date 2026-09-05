/** URL y clave pública (anon o publishable `sb_publishable_…`). */

export function supabasePublicEnv(): {
  url: string;
  key: string;
  ok: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  return { url, key, ok: Boolean(url && key) };
}

export const STAFF_ROLES = ["super_admin", "admin", "staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(r: string | undefined): r is StaffRole {
  return !!r && (STAFF_ROLES as readonly string[]).includes(r);
}
