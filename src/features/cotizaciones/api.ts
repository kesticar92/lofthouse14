// =============================================================================
// src/features/cotizaciones/api.ts
// -----------------------------------------------------------------------------
// Funciones puras que llaman a /api/admin/cotizaciones via apiClient.
// Devuelven `Cotizacion` ya aplanado para consumo directo de la UI.
// =============================================================================

import { apiClient } from "@/lib/api/client";
import type { Cotizacion } from "./types";
import type {
  CotizacionCreateInput,
  CotizacionUpdateInput,
} from "./schemas";

export async function listCotizaciones(params?: {
  status?: string;
  limit?: number;
}): Promise<Cotizacion[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient<Cotizacion[]>(`/api/admin/cotizaciones${suffix}`);
}

export async function getCotizacion(id: number): Promise<Cotizacion> {
  return apiClient<Cotizacion>(`/api/admin/cotizaciones/${id}`);
}

export async function createCotizacion(
  payload: CotizacionCreateInput,
): Promise<Cotizacion> {
  return apiClient<Cotizacion>(`/api/admin/cotizaciones`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCotizacion(
  id: number,
  payload: CotizacionUpdateInput,
): Promise<Cotizacion> {
  return apiClient<Cotizacion>(`/api/admin/cotizaciones/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCotizacion(
  id: number,
): Promise<{ id: number; deleted: boolean }> {
  return apiClient<{ id: number; deleted: boolean }>(
    `/api/admin/cotizaciones/${id}`,
    { method: "DELETE" },
  );
}
