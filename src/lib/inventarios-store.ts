"use client";

import { KEYS, safeGet, safeSet } from "./storage";
import type { EstadoItem, Funciona } from "./inventory-catalog";

/**
 * Foto de evidencia de un daño. Se almacena como data URL (base64) para que
 * el inventario completo pueda persistirse en localStorage y embeberse en el
 * PDF generado del lado del cliente sin depender de servicios externos.
 *
 * El navegador comprime la imagen antes de guardarla (ver `compressImage`).
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
