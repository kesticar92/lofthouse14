// =============================================================================
// src/features/inventarios/server.ts
// -----------------------------------------------------------------------------
// Helpers compartidos entre los route handlers del módulo inventarios.
// =============================================================================

import type { TypedSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FotoEvidenciaServer,
  InventarioItemServer,
  InventarioRevisionFull,
  InventarioRevisionRow,
} from "./types";

const FOTO_BUCKET = "inventario-fotos";
const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7; // 7 días

/**
 * Construye URLs firmadas para todas las fotos pasadas. Si una falla, devuelve
 * `url: null` para esa foto en lugar de tirar la operación entera.
 */
export async function signFotos(
  supabase: TypedSupabaseServerClient,
  fotos: { storage_path: string }[],
): Promise<(string | null)[]> {
  if (fotos.length === 0) return [];
  const paths = fotos.map((f) => f.storage_path);
  const { data, error } = await supabase.storage
    .from(FOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SEC);
  if (error || !data) return paths.map(() => null);
  return data.map((d) => (d.error ? null : (d.signedUrl ?? null)));
}

/**
 * Carga la revisión completa: cabecera + items + fotos con URLs firmadas.
 * Devuelve `null` si no existe.
 */
export async function loadRevisionFull(
  supabase: TypedSupabaseServerClient,
  revisionId: string,
): Promise<InventarioRevisionFull | null> {
  const { data: revision, error: errR } = await supabase
    .from("inventario_revisiones")
    .select("*")
    .eq("id", revisionId)
    .maybeSingle();
  if (errR) throw new Error(errR.message);
  if (!revision) return null;

  const { data: itemsRaw, error: errI } = await supabase
    .from("inventario_revision_items")
    .select("*")
    .eq("revision_id", revisionId)
    .order("orden", { ascending: true });
  if (errI) throw new Error(errI.message);
  const items = itemsRaw ?? [];

  if (items.length === 0) {
    return { ...revision, items: [] };
  }

  const { data: fotosRaw, error: errF } = await supabase
    .from("inventario_revision_fotos")
    .select("*")
    .in(
      "item_id",
      items.map((i) => i.id),
    );
  if (errF) throw new Error(errF.message);
  const fotos = fotosRaw ?? [];

  const signedUrls = await signFotos(supabase, fotos);
  const fotosByItem = new Map<string, FotoEvidenciaServer[]>();
  fotos.forEach((f, idx) => {
    const enriched: FotoEvidenciaServer = { ...f, url: signedUrls[idx] };
    const arr = fotosByItem.get(f.item_id) ?? [];
    arr.push(enriched);
    fotosByItem.set(f.item_id, arr);
  });

  const enrichedItems: InventarioItemServer[] = items.map((it) => ({
    ...it,
    fotos: fotosByItem.get(it.id) ?? [],
  }));

  return { ...revision, items: enrichedItems };
}

/**
 * Devuelve la lista de revisiones con conteos agregados (sin cargar items).
 */
export async function listRevisionsWithCounts(
  supabase: TypedSupabaseServerClient,
  filters?: { loft_id?: string; limit?: number },
): Promise<
  (InventarioRevisionRow & {
    items_count: number;
    con_atencion: number;
    fotos_count: number;
  })[]
> {
  let q = supabase
    .from("inventario_revisiones")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 200);
  if (filters?.loft_id) q = q.eq("loft_id", filters.loft_id);
  const { data: revisions, error } = await q;
  if (error) throw new Error(error.message);
  const list = revisions ?? [];

  if (list.length === 0) return [];

  // Carga sólo las columnas necesarias para contar
  const { data: items, error: errI } = await supabase
    .from("inventario_revision_items")
    .select("id, revision_id, requiere_atencion")
    .in(
      "revision_id",
      list.map((r) => r.id),
    );
  if (errI) throw new Error(errI.message);

  const { data: fotos, error: errF } = await supabase
    .from("inventario_revision_fotos")
    .select("id, item_id");
  if (errF) throw new Error(errF.message);

  const itemsByRev = new Map<string, { id: string; requiere: boolean }[]>();
  (items ?? []).forEach((it) => {
    const arr = itemsByRev.get(it.revision_id) ?? [];
    arr.push({ id: it.id, requiere: it.requiere_atencion });
    itemsByRev.set(it.revision_id, arr);
  });

  const fotosByItem = new Map<string, number>();
  (fotos ?? []).forEach((f) => {
    fotosByItem.set(f.item_id, (fotosByItem.get(f.item_id) ?? 0) + 1);
  });

  return list.map((r) => {
    const myItems = itemsByRev.get(r.id) ?? [];
    const fotosCount = myItems.reduce(
      (s, it) => s + (fotosByItem.get(it.id) ?? 0),
      0,
    );
    return {
      ...r,
      items_count: myItems.length,
      con_atencion: myItems.filter((it) => it.requiere).length,
      fotos_count: fotosCount,
    };
  });
}

export const FOTO_BUCKET_NAME = FOTO_BUCKET;
