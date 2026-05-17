"use client";

// =============================================================================
// src/features/inventarios/hooks.ts
// -----------------------------------------------------------------------------
// Hooks de React Query para el módulo inventarios.
// =============================================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import {
  createInventario,
  deleteFoto,
  deleteInventario,
  getInventario,
  listInventarios,
  updateInventario,
  uploadFoto,
} from "./api";
import type {
  FotoEvidenciaServer,
  InventarioRevisionFull,
  InventarioRevisionSummary,
} from "./types";
import type {
  InventarioRevisionCreateInput,
  InventarioRevisionUpdateInput,
} from "./schemas";

const baseKey = ["inventarios"] as const;

export const inventariosKeys = {
  all: baseKey,
  list: (filters?: { loft_id?: string }) =>
    filters ? ([...baseKey, filters] as const) : baseKey,
  detail: (id: string) => [...baseKey, "byId", id] as const,
};

export function useInventarios(
  filters?: { loft_id?: string; limit?: number },
  options?: Omit<
    UseQueryOptions<InventarioRevisionSummary[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<InventarioRevisionSummary[], Error>({
    queryKey: inventariosKeys.list(filters),
    queryFn: () => listInventarios(filters),
    ...options,
  });
}

export function useInventario(
  id: string | null,
  options?: Omit<
    UseQueryOptions<InventarioRevisionFull, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<InventarioRevisionFull, Error>({
    queryKey: inventariosKeys.detail(id ?? ""),
    queryFn: () => getInventario(id as string),
    enabled: typeof id === "string" && id.length > 0,
    ...options,
  });
}

export function useCreateInventario(
  options?: UseMutationOptions<
    InventarioRevisionFull,
    Error,
    InventarioRevisionCreateInput
  >,
) {
  const qc = useQueryClient();
  return useMutation<
    InventarioRevisionFull,
    Error,
    InventarioRevisionCreateInput
  >({
    mutationFn: createInventario,
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: inventariosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateInventario(
  options?: UseMutationOptions<
    InventarioRevisionFull,
    Error,
    { id: string; patch: InventarioRevisionUpdateInput }
  >,
) {
  const qc = useQueryClient();
  return useMutation<
    InventarioRevisionFull,
    Error,
    { id: string; patch: InventarioRevisionUpdateInput }
  >({
    mutationFn: ({ id, patch }) => updateInventario(id, patch),
    ...options,
    onSuccess: (...args) => {
      const vars = args[1];
      qc.invalidateQueries({ queryKey: inventariosKeys.all });
      qc.invalidateQueries({ queryKey: inventariosKeys.detail(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteInventario(
  options?: UseMutationOptions<
    { id: string; deleted: boolean },
    Error,
    string
  >,
) {
  const qc = useQueryClient();
  return useMutation<{ id: string; deleted: boolean }, Error, string>({
    mutationFn: deleteInventario,
    ...options,
    onSuccess: (...args) => {
      const id = args[1];
      qc.invalidateQueries({ queryKey: inventariosKeys.all });
      qc.removeQueries({ queryKey: inventariosKeys.detail(id) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUploadFoto(
  options?: UseMutationOptions<
    FotoEvidenciaServer,
    Error,
    { revisionId: string; itemId: string; file: File; caption?: string }
  >,
) {
  const qc = useQueryClient();
  return useMutation<
    FotoEvidenciaServer,
    Error,
    { revisionId: string; itemId: string; file: File; caption?: string }
  >({
    mutationFn: ({ revisionId, itemId, file, caption }) =>
      uploadFoto(revisionId, itemId, file, caption ?? ""),
    ...options,
    onSuccess: (...args) => {
      const vars = args[1];
      qc.invalidateQueries({ queryKey: inventariosKeys.detail(vars.revisionId) });
      qc.invalidateQueries({ queryKey: inventariosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteFoto(
  options?: UseMutationOptions<
    { id: string; deleted: boolean },
    Error,
    { revisionId: string; itemId: string; fotoId: string }
  >,
) {
  const qc = useQueryClient();
  return useMutation<
    { id: string; deleted: boolean },
    Error,
    { revisionId: string; itemId: string; fotoId: string }
  >({
    mutationFn: ({ revisionId, itemId, fotoId }) =>
      deleteFoto(revisionId, itemId, fotoId),
    ...options,
    onSuccess: (...args) => {
      const vars = args[1];
      qc.invalidateQueries({ queryKey: inventariosKeys.detail(vars.revisionId) });
      qc.invalidateQueries({ queryKey: inventariosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
