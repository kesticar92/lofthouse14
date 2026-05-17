import type { StaffRole } from "@/lib/supabase/env";

/**
 * Claves de módulo del panel admin (alineadas con `profiles.allowed_modules`
 * y la navegación en `admin-shell`).
 */
export const ADMIN_MODULE_KEYS = [
  "cotizaciones",
  "inventario",
  "reservas",
  "gastos",
  "aseos",
  "usuarios",
] as const;

export type AdminModuleKey = (typeof ADMIN_MODULE_KEYS)[number];

/** Etiquetas para UI (lista de usuarios, checkboxes de permisos). */
export const ADMIN_MODULE_LABELS = {
  cotizaciones: "Cotizaciones",
  inventario: "Inventario",
  reservas: "Reservas",
  gastos: "Gastos",
  aseos: "Aseos del día",
  usuarios: "Usuarios",
} as const satisfies Record<AdminModuleKey, string>;

/** Opciones para pickers (todos los módulos persistibles en `profiles`). */
export const ADMIN_MODULE_OPTIONS: { key: AdminModuleKey; label: string }[] =
  ADMIN_MODULE_KEYS.map((key) => ({
    key,
    label: ADMIN_MODULE_LABELS[key],
  }));

/**
 * Módulos que se suelen asignar a rol `staff` en la UI.
 * `usuarios` lo gestionan cuentas admin/super_admin desde la misma pantalla.
 */
export const ADMIN_STAFF_MODULE_OPTIONS: { key: AdminModuleKey; label: string }[] =
  ADMIN_MODULE_KEYS.filter((k) => k !== "usuarios").map((key) => ({
    key,
    label: ADMIN_MODULE_LABELS[key],
  }));

export function isAdminModuleKey(s: string): s is AdminModuleKey {
  return (ADMIN_MODULE_KEYS as readonly string[]).includes(s);
}

export function adminModuleLabel(key: string): string {
  return isAdminModuleKey(key) ? ADMIN_MODULE_LABELS[key] : key;
}

/** Rutas del panel por módulo (fuente única para nav, middleware y guards). */
export const ADMIN_MODULE_PATHS = {
  cotizaciones: "/admin/cotizaciones",
  inventario: "/admin/inventario",
  reservas: "/admin/reservas",
  gastos: "/admin/gastos",
  aseos: "/admin/aseos",
  usuarios: "/admin/usuarios",
} as const satisfies Record<AdminModuleKey, string>;

/** Pantallas que solo pueden ver `admin` y `super_admin` (no por `allowed_modules`). */
export function isAdminOnlyAdminPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  return (
    p === ADMIN_MODULE_PATHS.usuarios ||
    p.startsWith(`${ADMIN_MODULE_PATHS.usuarios}/`)
  );
}

/** Módulo requerido para una ruta `/admin/...`, o `null` si no aplica (p. ej. `/admin`). */
export function adminModuleForPath(pathname: string): AdminModuleKey | null {
  const p = pathname.replace(/\/$/, "") || "/";
  for (const key of ADMIN_MODULE_KEYS) {
    const base = ADMIN_MODULE_PATHS[key];
    if (p === base || p.startsWith(`${base}/`)) return key;
  }
  return null;
}

export function staffHasModuleAccess(
  profile: { role: StaffRole; allowed_modules: string[] },
  moduleKey: AdminModuleKey,
): boolean {
  if (profile.role === "super_admin" || profile.role === "admin") return true;
  return (profile.allowed_modules ?? []).includes(moduleKey);
}

export function staffCanAccessAdminPath(
  profile: { role: StaffRole; allowed_modules: string[] },
  pathname: string,
): boolean {
  if (isAdminOnlyAdminPath(pathname)) {
    return profile.role === "super_admin" || profile.role === "admin";
  }
  const required = adminModuleForPath(pathname);
  if (!required) return true;
  return staffHasModuleAccess(profile, required);
}
