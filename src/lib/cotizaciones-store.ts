"use client";

import { KEYS, safeGet, safeSet } from "./storage";
import type { QuoteInput, QuoteResult, PricingConfig } from "./pricing";

export type CotizacionGuardada = {
  id: string;
  creadaEn: string; // ISO datetime
  cliente: string;
  /** Documento de identidad o NIT del cliente. Opcional para compatibilidad
   * con cotizaciones guardadas antes de exigirlo. */
  documento?: string;
  telefono: string;
  /** Correo del cliente (opcional). */
  email?: string;
  observaciones: string;
  input: QuoteInput;
  config: PricingConfig;
  result: QuoteResult;
};

export function listarCotizaciones(): CotizacionGuardada[] {
  return safeGet<CotizacionGuardada[]>(KEYS.cotizaciones, []);
}

export function guardarCotizacion(c: CotizacionGuardada) {
  const all = listarCotizaciones();
  const idx = all.findIndex((x) => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.unshift(c);
  safeSet(KEYS.cotizaciones, all);
}

export function eliminarCotizacion(id: string) {
  const all = listarCotizaciones().filter((x) => x.id !== id);
  safeSet(KEYS.cotizaciones, all);
}

export function getPricingConfig(defaults: PricingConfig): PricingConfig {
  return safeGet<PricingConfig>(KEYS.pricing, defaults);
}

export function setPricingConfig(cfg: PricingConfig) {
  safeSet(KEYS.pricing, cfg);
}
