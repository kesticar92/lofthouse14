// =============================================================================
// src/features/inventarios/types.ts
// -----------------------------------------------------------------------------
// Tipos del dominio "inventario" tal como circulan entre frontend y API.
//
// Una "revisión" es un evento histórico (fecha, persona, loft) que contiene
// N items revisados, cada uno con su propio estado y eventualmente fotos
// almacenadas en Supabase Storage (bucket `inventario-fotos`).
// =============================================================================

import type { Tables } from "@/types/database.types";

export type InventarioRevisionRow = Tables<"inventario_revisiones">;
export type InventarioRevisionItemRow = Tables<"inventario_revision_items">;
export type InventarioRevisionFotoRow = Tables<"inventario_revision_fotos">;

/** Foto enriquecida con URL firmada lista para mostrar en <img>. */
export type FotoEvidenciaServer = InventarioRevisionFotoRow & {
  url: string | null;
};

/** Item enriquecido con sus fotos resueltas. */
export type InventarioItemServer = InventarioRevisionItemRow & {
  fotos: FotoEvidenciaServer[];
};

/** Revisión completa con items + fotos resueltos. */
export type InventarioRevisionFull = InventarioRevisionRow & {
  items: InventarioItemServer[];
};

/** Forma resumida (sin items) para listados. */
export type InventarioRevisionSummary = InventarioRevisionRow & {
  items_count: number;
  con_atencion: number;
  fotos_count: number;
};
