"use client";

/**
 * @deprecated DESDE FASE 1 — Los aseos viven en `cleaning_tasks` (Postgres).
 *
 * Este archivo se mantiene SOLO como referencia del shape histórico para
 * eventuales migraciones de datos de localStorage. Las páginas activas
 * (`/admin/aseos`, dashboard `/admin`) NO deben usarlo.
 *
 * Para consumir los datos reales:
 *   - Listado del día:   `GET /api/admin/cleaning-tasks?date=YYYY-MM-DD`
 *   - Resumen:           `GET /api/admin/cleaning-summary?date=...&month=...`
 *   - Edición/asignación: `PATCH /api/admin/cleaning-tasks/{id}`
 *
 * En la próxima limpieza (Fase 2) este archivo se elimina si no quedan
 * importaciones.
 */

import { KEYS, safeGet, safeSet } from "./storage";

export type AseoEstado = "Pendiente" | "En proceso" | "Hecho";
export type AseoTipo =
  | "Entre huéspedes"
  | "Check-out"
  | "Check-in"
  | "Mantenimiento / profundo"
  | "Revisión general";

export type AseoGuardado = {
  id: string;
  creadoEn: string; // ISO
  fecha: string; // yyyy-mm-dd
  loft: number;
  tipo: AseoTipo;
  hora?: string; // HH:MM
  personal: string;
  estado: AseoEstado;
  notas?: string;
  completadoEn?: string; // ISO
};

export const TIPOS_ASEO: AseoTipo[] = [
  "Entre huéspedes",
  "Check-out",
  "Check-in",
  "Mantenimiento / profundo",
  "Revisión general",
];

export const ESTADOS_ASEO: AseoEstado[] = ["Pendiente", "En proceso", "Hecho"];

export function listarAseos(): AseoGuardado[] {
  return safeGet<AseoGuardado[]>(KEYS.aseos, []);
}

export function guardarAseo(a: AseoGuardado) {
  const all = listarAseos();
  const idx = all.findIndex((x) => x.id === a.id);
  if (idx >= 0) all[idx] = a;
  else all.unshift(a);
  safeSet(KEYS.aseos, all);
}

export function eliminarAseo(id: string) {
  const all = listarAseos().filter((x) => x.id !== id);
  safeSet(KEYS.aseos, all);
}
