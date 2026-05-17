// =============================================================================
// src/features/cotizaciones/types.ts
// -----------------------------------------------------------------------------
// Tipos del dominio "cotización" tal como circulan entre frontend y API.
//
// La fila en BD (`Tables<"cotizaciones">`) tiene columnas top-level (campos
// principales para indexar y buscar) + un `metadata jsonb` libre donde
// guardamos el snapshot completo de input/config/result para poder
// re-imprimir o recalcular sin perder información.
//
// El tipo `Cotizacion` que ven los componentes mezcla ambos: las columnas
// top-level y los campos derivados de `metadata` aplanados.
// =============================================================================

import type { Tables } from "@/types/database.types";
import type { PricingConfig, QuoteInput, QuoteResult } from "@/lib/pricing";

export type CotizacionRow = Tables<"cotizaciones">;

export const COTIZACION_STATUSES = [
  "draft",
  "sent",
  "confirmed",
  "cancelled",
] as const;
export type CotizacionStatus = (typeof COTIZACION_STATUSES)[number];

/** Datos extra que viajan dentro de `metadata jsonb` en la BD. */
export type CotizacionMetadata = {
  cliente: string;
  documento?: string;
  telefono: string;
  email?: string;
  observaciones: string;
  input: QuoteInput;
  config: PricingConfig;
  result: QuoteResult;
};

/** Vista plana usada por la UI (combina row + metadata). */
export type Cotizacion = {
  id: number;
  status: CotizacionStatus;
  guest_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  loft_id: string;
  price_per_night: number;
  total: number;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Aplanados desde metadata
  cliente: string;
  documento: string;
  telefono: string;
  email: string;
  observaciones: string;
  input: QuoteInput;
  config: PricingConfig;
  result: QuoteResult;
};

export function rowToCotizacion(row: CotizacionRow): Cotizacion {
  const meta = (row.metadata ?? {}) as Partial<CotizacionMetadata>;
  return {
    id: row.id,
    status: (row.status as CotizacionStatus) ?? "draft",
    guest_name: row.guest_name,
    check_in: row.check_in,
    check_out: row.check_out,
    guests: row.guests,
    loft_id: row.loft_id,
    price_per_night: Number(row.price_per_night),
    total: Number(row.total),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    cliente: meta.cliente ?? row.guest_name,
    documento: meta.documento ?? "",
    telefono: meta.telefono ?? "",
    email: meta.email ?? "",
    observaciones: meta.observaciones ?? row.notes ?? "",
    input: meta.input ?? {
      checkIn: row.check_in,
      checkOut: row.check_out,
      huespedes: row.guests,
      lofts: 1,
    },
    config: meta.config ?? ({} as PricingConfig),
    result: meta.result ?? ({} as QuoteResult),
  };
}
