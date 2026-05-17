"use client";

/**
 * @deprecated DESDE FASE 1 — Los inventarios viven en `inventario_revisiones`
 * (Postgres) y las fotos en el bucket Storage `inventario-fotos`.
 *
 * Este archivo se mantiene SOLO para que la rutina de migración
 * (`features/inventarios/migrate.ts`) pueda leer datos antiguos de
 * localStorage y subirlos al servidor. La UI activa
 * (`/admin/inventario`) NO debe importar ni `guardarInventario` ni
 * `eliminarInventario` — usa los hooks de `features/inventarios/hooks.ts`.
 */

import { KEYS, safeGet, safeSet } from "./storage";
import type { EstadoItem, Funciona } from "./inventory-catalog";

/**
 * Foto de evidencia de un daño. En la versión actual las fotos se suben a
 * Supabase Storage; este tipo solo existe para la migración de datos viejos.
 */
export type FotoEvidencia = {
  id: string;
  /** data:image/jpeg;base64,... — listo para usar en <img src> y en PDF. */
  dataUrl: string;
  /** Bytes aproximados después de compresión (para diagnóstico). */
  bytes?: number;
  /** Comentario opcional sobre lo que muestra la foto. */
  caption?: string;
  /** ISO datetime de captura/carga. */
  creadaEn: string;
};

export type InventarioItemResultado = {
  orden: number;
  zona: string;
  item: string;
  estado: EstadoItem;
  funciona: Funciona;
  detalles: string;
  requiereAtencion: boolean;
  /** Fotos de evidencia. Solo aplica cuando hay daño / no funciona. */
  fotos?: FotoEvidencia[];
};

export type InventarioGuardado = {
  id: string;
  creadoEn: string; // ISO
  loft: number;
  persona: string;
  fecha: string; // yyyy-mm-dd
  items: InventarioItemResultado[];
};

export function listarInventarios(): InventarioGuardado[] {
  return safeGet<InventarioGuardado[]>(KEYS.inventarios, []);
}

export function guardarInventario(inv: InventarioGuardado) {
  const all = listarInventarios();
  const idx = all.findIndex((x) => x.id === inv.id);
  if (idx >= 0) all[idx] = inv;
  else all.unshift(inv);
  safeSet(KEYS.inventarios, all);
}

export function eliminarInventario(id: string) {
  const all = listarInventarios().filter((x) => x.id !== id);
  safeSet(KEYS.inventarios, all);
}
