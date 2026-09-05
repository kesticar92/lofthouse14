"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, toISODateString } from "@/lib/pms/date-range";
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

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || res.statusText);
  }
}

export function usePmsModule() {
  const [viewFrom, setViewFrom] = useState(() =>
    toISODateString(new Date(Date.now() - 7 * 86400000)),
  );
  const viewDays = 90;
  const viewTo = addDays(viewFrom, viewDays);

  const [bundle, setBundle] = useState<PmsBundle>({
    properties: [],
    reservations: [],
    blocks: [],
    icalSources: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [pres, resv, srcs] = await Promise.all([
        fetch("/api/admin/pms/properties", { credentials: "include" }),
        fetch(
          `/api/admin/pms/reservations?from=${encodeURIComponent(viewFrom)}&to=${encodeURIComponent(viewTo)}`,
          { credentials: "include" },
        ),
        fetch("/api/admin/pms/ical-sources", { credentials: "include" }),
      ]);
      if (!pres.ok) {
        const j = await parseJson<{ error?: string }>(pres);
        throw new Error(j.error ?? pres.statusText);
      }
      if (!resv.ok) {
        const j = await parseJson<{ error?: string }>(resv);
        throw new Error(j.error ?? resv.statusText);
      }
      if (!srcs.ok) {
        const j = await parseJson<{ error?: string }>(srcs);
        throw new Error(j.error ?? srcs.statusText);
      }
      const pj = await parseJson<{ properties: PropertyRow[] }>(pres);
      const rj = await parseJson<{
        reservations: ReservationRow[];
        blocks: AvailabilityBlockRow[];
      }>(resv);
      const sj = await parseJson<{ sources: IcalSourceRow[] }>(srcs);
      setBundle({
        properties: pj.properties ?? [],
        reservations: rj.reservations ?? [],
        blocks: rj.blocks ?? [],
        icalSources: sj.sources ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [viewFrom, viewTo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...bundle,
    viewFrom,
    setViewFrom,
    viewDays,
    viewTo,
    loading,
    error,
    refresh,
  };
}
