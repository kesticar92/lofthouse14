// =============================================================================
// src/features/inventarios/schemas.ts
// -----------------------------------------------------------------------------
// Esquemas zod para validar bodies y params en los route handlers de
// inventarios.
// =============================================================================

import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD");

export const inventarioItemInputSchema = z.object({
  orden: z.number().int().nonnegative().default(0),
  zona: z.string().min(1),
  item: z.string().min(1),
  estado: z.string().default("OK"),
  funciona: z.string().default("Sí"),
  detalles: z.string().default(""),
  requiere_atencion: z.boolean().default(false),
});

export const inventarioRevisionCreateSchema = z.object({
  loft_id: z.string().min(1),
  persona: z.string().default(""),
  fecha: dateString,
  items: z.array(inventarioItemInputSchema).min(1),
});

export const inventarioRevisionUpdateSchema = z.object({
  persona: z.string().optional(),
  fecha: dateString.optional(),
  // Si se incluyen items, se reemplazan TODOS los items de la revisión
  // (las fotos asociadas a items que se eliminen también se borran por CASCADE).
  items: z.array(inventarioItemInputSchema).optional(),
});

export const inventarioIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const inventarioItemIdParamSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const inventarioFotoIdParamSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  fotoId: z.string().uuid(),
});

export const inventarioListQuerySchema = z.object({
  loft_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export type InventarioRevisionCreateInput = z.infer<
  typeof inventarioRevisionCreateSchema
>;
export type InventarioRevisionUpdateInput = z.infer<
  typeof inventarioRevisionUpdateSchema
>;
export type InventarioItemInput = z.infer<typeof inventarioItemInputSchema>;
