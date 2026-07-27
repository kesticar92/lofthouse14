"use client";

import { KEYS, safeGet, safeSet } from "./storage";
import type { EstadoItem, Funciona } from "./inventory-catalog";

export type InventarioItemResultado = {
  orden: number;
  zona: string;
  item: string;
  estado: EstadoItem;
  funciona: Funciona;
  detalles: string;
  requiereAtencion: boolean;
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
