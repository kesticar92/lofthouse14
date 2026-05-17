// =============================================================================
// Cliente HTTP del PMS (panel admin). Centraliza fetch + errores vía apiClient.
// =============================================================================

import { ApiClientError, apiClient } from "@/lib/api/client";
import type {
  AvailabilityBlockRow,
  IcalSourceRow,
  PropertyRow,
  ReservationRow,
} from "@/lib/pms/types";

export type PmsBundle = {
  properties: PropertyRow[];
  reservations: ReservationRow[];
  blocks: AvailabilityBlockRow[];
  icalSources: IcalSourceRow[];
};

export async function fetchPmsBundle(
  viewFrom: string,
  viewTo: string,
): Promise<PmsBundle> {
  const [pj, rj, sj] = await Promise.all([
    apiClient<{ properties: PropertyRow[] }>("/api/admin/pms/properties"),
    apiClient<{ reservations: ReservationRow[]; blocks: AvailabilityBlockRow[] }>(
      `/api/admin/pms/reservations?from=${encodeURIComponent(viewFrom)}&to=${encodeURIComponent(viewTo)}`,
    ),
    apiClient<{ sources: IcalSourceRow[] }>("/api/admin/pms/ical-sources"),
  ]);
  return {
    properties: pj.properties ?? [],
    reservations: rj.reservations ?? [],
    blocks: rj.blocks ?? [],
    icalSources: sj.sources ?? [],
  };
}

export type PmsPostResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toErrorMessage(e: unknown): string {
  if (e instanceof ApiClientError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}

async function safeApi<T>(fn: () => Promise<T>): Promise<PmsPostResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

/** POST JSON genérico al dominio PMS (compat con rutas legacy `{ error }`). */
export function postPmsJson<T>(path: string, body: unknown): Promise<PmsPostResult<T>> {
  return safeApi(() =>
    apiClient<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

export async function patchReservationMove(payload: {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await safeApi(() =>
    apiClient(`/api/admin/pms/reservations/${payload.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        property_id: payload.property_id,
        check_in: payload.check_in,
        check_out: payload.check_out,
      }),
    }),
  );
  if (!r.ok) return r;
  return { ok: true };
}

export async function patchProperty(body: {
  id: string;
  name?: string;
  regenerate_ical_token?: boolean;
}): Promise<PmsPostResult<{ property: PropertyRow }>> {
  return safeApi(() =>
    apiClient<{ property: PropertyRow }>("/api/admin/pms/properties", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
}

export async function deletePropertyById(
  id: string,
): Promise<PmsPostResult<{ deleted: boolean }>> {
  return safeApi(() =>
    apiClient<{ deleted: boolean }>(
      `/api/admin/pms/properties?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
  );
}

type IcalSyncApiData = {
  ok: boolean;
  message: string;
  upserted: number;
};

export async function requestPmsIcalSync(
  id: string,
): Promise<
  { ok: true; message?: string } | { ok: false; error: string }
> {
  const r = await safeApi(() =>
    apiClient<IcalSyncApiData>(
      `/api/admin/pms/ical-sources/${id}/sync`,
      { method: "POST" },
    ),
  );
  if (!r.ok) return { ok: false, error: r.error };
  if (r.data.ok === false) {
    return {
      ok: false,
      error: r.data.message?.trim() || "Error al sincronizar",
    };
  }
  return { ok: true, message: r.data.message };
}

export async function deleteIcalSourceById(
  id: string,
): Promise<PmsPostResult<unknown>> {
  return safeApi(() =>
    apiClient(`/api/admin/pms/ical-sources/${id}`, { method: "DELETE" }),
  );
}
