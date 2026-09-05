// =============================================================================
// src/features/inventarios/api.ts
// -----------------------------------------------------------------------------
// Funciones puras que llaman a /api/admin/inventarios via apiClient.
// =============================================================================

import { apiClient } from "@/lib/api/client";
import type {
  FotoEvidenciaServer,
  InventarioRevisionFull,
  InventarioRevisionSummary,
} from "./types";
import type {
  InventarioRevisionCreateInput,
  InventarioRevisionUpdateInput,
} from "./schemas";

export async function listInventarios(params?: {
  loft_id?: string;
  limit?: number;
}): Promise<InventarioRevisionSummary[]> {
  const qs = new URLSearchParams();
  if (params?.loft_id) qs.set("loft_id", params.loft_id);
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient<InventarioRevisionSummary[]>(
    `/api/admin/inventarios${suffix}`,
  );
}

export async function getInventario(
  id: string,
): Promise<InventarioRevisionFull> {
  return apiClient<InventarioRevisionFull>(`/api/admin/inventarios/${id}`);
}

export async function createInventario(
  payload: InventarioRevisionCreateInput,
): Promise<InventarioRevisionFull> {
  return apiClient<InventarioRevisionFull>(`/api/admin/inventarios`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateInventario(
  id: string,
  payload: InventarioRevisionUpdateInput,
): Promise<InventarioRevisionFull> {
  return apiClient<InventarioRevisionFull>(`/api/admin/inventarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteInventario(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  return apiClient<{ id: string; deleted: boolean }>(
    `/api/admin/inventarios/${id}`,
    { method: "DELETE" },
  );
}

export async function uploadFoto(
  revisionId: string,
  itemId: string,
  file: File,
  caption = "",
): Promise<FotoEvidenciaServer> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("caption", caption);
  return apiClient<FotoEvidenciaServer>(
    `/api/admin/inventarios/${revisionId}/items/${itemId}/fotos`,
    { method: "POST", body: fd },
  );
}

export async function deleteFoto(
  revisionId: string,
  itemId: string,
  fotoId: string,
): Promise<{ id: string; deleted: boolean }> {
  return apiClient<{ id: string; deleted: boolean }>(
    `/api/admin/inventarios/${revisionId}/items/${itemId}/fotos/${fotoId}`,
    { method: "DELETE" },
  );
}
