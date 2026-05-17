"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPmsBundle, type PmsBundle } from "@/features/pms/admin-api";
import { addDays, toISODateString } from "@/lib/pms/date-range";

export type { PmsBundle };

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
      const next = await fetchPmsBundle(viewFrom, viewTo);
      setBundle(next);
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
