"use client";

// =============================================================================
// src/features/cotizaciones/hooks.ts
// -----------------------------------------------------------------------------
// Hooks de React Query para el módulo cotizaciones.
//
// Convención de queryKeys:
//   ["cotizaciones"]                    → lista global
//   ["cotizaciones", { status }]        → lista filtrada
//   ["cotizaciones", "byId", id]        → detalle
//
// Las mutaciones invalidan la lista; los hooks individuales también
// invalidan su detalle al actualizar/eliminar.
// =============================================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import {
  createCotizacion,
  deleteCotizacion,
  getCotizacion,
  listCotizaciones,
  updateCotizacion,
} from "./api";
import type { Cotizacion } from "./types";
import type {
  CotizacionCreateInput,
  CotizacionUpdateInput,
} from "./schemas";

const baseKey = ["cotizaciones"] as const;

export const cotizacionesKeys = {
  all: baseKey,
  list: (filters?: { status?: string }) =>
    filters ? ([...baseKey, filters] as const) : baseKey,
  detail: (id: number) => [...baseKey, "byId", id] as const,
};

export function useCotizaciones(
  filters?: { status?: string; limit?: number },
  options?: Omit<
    UseQueryOptions<Cotizacion[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<Cotizacion[], Error>({
    queryKey: cotizacionesKeys.list(filters),
    queryFn: () => listCotizaciones(filters),
    ...options,
  });
}

export function useCotizacion(
  id: number | null,
  options?: Omit<UseQueryOptions<Cotizacion, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<Cotizacion, Error>({
    queryKey: cotizacionesKeys.detail(id ?? -1),
    queryFn: () => getCotizacion(id as number),
    enabled: typeof id === "number" && id > 0,
    ...options,
  });
}

export function useCreateCotizacion(
  options?: UseMutationOptions<Cotizacion, Error, CotizacionCreateInput>,
) {
  const qc = useQueryClient();
  return useMutation<Cotizacion, Error, CotizacionCreateInput>({
    mutationFn: createCotizacion,
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: cotizacionesKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateCotizacion(
  options?: UseMutationOptions<
    Cotizacion,
    Error,
    { id: number; patch: CotizacionUpdateInput }
  >,
) {
  const qc = useQueryClient();
  return useMutation<
    Cotizacion,
    Error,
    { id: number; patch: CotizacionUpdateInput }
  >({
    mutationFn: ({ id, patch }) => updateCotizacion(id, patch),
    ...options,
    onSuccess: (...args) => {
      const vars = args[1];
      qc.invalidateQueries({ queryKey: cotizacionesKeys.all });
      qc.invalidateQueries({ queryKey: cotizacionesKeys.detail(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteCotizacion(
  options?: UseMutationOptions<
    { id: number; deleted: boolean },
    Error,
    number
  >,
) {
  const qc = useQueryClient();
  return useMutation<{ id: number; deleted: boolean }, Error, number>({
    mutationFn: deleteCotizacion,
    ...options,
    onSuccess: (...args) => {
      const id = args[1];
      qc.invalidateQueries({ queryKey: cotizacionesKeys.all });
      qc.removeQueries({ queryKey: cotizacionesKeys.detail(id) });
      options?.onSuccess?.(...args);
    },
  });
}
