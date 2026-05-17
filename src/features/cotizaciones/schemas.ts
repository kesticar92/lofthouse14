// =============================================================================
// src/features/cotizaciones/schemas.ts
// -----------------------------------------------------------------------------
// Esquemas zod compartidos entre route handlers (validación de request body)
// y cliente (validación opcional pre-submit).
// =============================================================================

import { z } from "zod";
import { COTIZACION_STATUSES } from "./types";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD");

const pricingConfigSchema = z.object({
  tarifaLJ: z.number().nonnegative(),
  tarifaVD: z.number().nonnegative(),
  recargoHuesped: z.number().nonnegative(),
  aseoCorta: z.number().nonnegative(),
  aseoMedia: z.number().nonnegative(),
  aseoSemanal: z.number().nonnegative(),
  descuentoSemanal: z.number().min(0).max(1),
  descuentoMensual: z.number().min(0).max(1),
});

const quoteInputSchema = z.object({
  checkIn: dateString,
  checkOut: dateString,
  huespedes: z.number().int().nonnegative(),
  lofts: z.number().int().min(1),
});

const quoteResultSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  noches: z.number(),
  nochesLJ: z.number(),
  nochesVD: z.number(),
  subtotalAlojamiento: z.number(),
  recargoHuespedes: z.number(),
  aseoTotal: z.number(),
  aseoDetalle: z.string(),
  subtotalReserva: z.number(),
  descuento: z.number(),
  descuentoDetalle: z.string(),
  totalReserva: z.number(),
  nightByNight: z.array(
    z.object({
      n: z.number(),
      date: dateString,
      dia: z.string(),
      esFinDeSemana: z.boolean(),
      tarifa: z.number(),
    }),
  ),
});

export const cotizacionMetadataSchema = z.object({
  cliente: z.string().default(""),
  documento: z.string().optional(),
  telefono: z.string().default(""),
  email: z.string().email().or(z.literal("")).optional(),
  observaciones: z.string().default(""),
  input: quoteInputSchema,
  config: pricingConfigSchema,
  result: quoteResultSchema,
});

export const cotizacionCreateSchema = z.object({
  guest_name: z.string().default(""),
  check_in: dateString,
  check_out: dateString,
  guests: z.number().int().min(1),
  loft_id: z.string().default(""),
  price_per_night: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
  notes: z.string().default(""),
  status: z.enum(COTIZACION_STATUSES).default("draft"),
  metadata: cotizacionMetadataSchema,
});

export const cotizacionUpdateSchema = cotizacionCreateSchema.partial();

export const cotizacionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const cotizacionListQuerySchema = z.object({
  status: z.enum(COTIZACION_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export type CotizacionCreateInput = z.infer<typeof cotizacionCreateSchema>;
export type CotizacionUpdateInput = z.infer<typeof cotizacionUpdateSchema>;
export type CotizacionListQuery = z.infer<typeof cotizacionListQuerySchema>;
