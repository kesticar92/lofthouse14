"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<{
    metrics?: Record<string, number | string>;
    recommendations?: Array<{ title: string; suggestedAction: string }>;
    ai?: { message: string; ok: boolean };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string }).error ?? `Error ${res.status}`);
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("No se pudo cargar analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = data?.metrics ?? {};
  const recs = data?.recommendations ?? [];

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">ANALYTICS</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Reportes, recomendaciones de revenue (sin auto-apply) y AI stub.
          </p>
        </div>
        <a
          href="/api/admin/analytics?format=csv"
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
        >
          Export CSV
        </a>
      </div>
      <AdminCard title="Métricas" subtitle="Ocupación / ADR / RevPAR">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && Object.keys(metrics).length === 0}
          emptyMessage="Sin métricas (crea reservas para ver ocupación)."
          onRetry={() => void load()}
        >
          <pre className="text-xs">{JSON.stringify(metrics, null, 2)}</pre>
        </AdminAsyncState>
      </AdminCard>
      <AdminCard title="Revenue recommendations" subtitle="autoApply=false">
        <AdminAsyncState
          loading={loading}
          empty={!loading && recs.length === 0}
          emptyMessage="Sin recomendaciones en este momento."
        >
          <ul className="space-y-2 text-sm">
            {recs.map((r, i) => (
              <li
                key={i}
                className="rounded border border-black/10 p-2 dark:border-white/10"
              >
                <strong>{r.title}</strong>
                <p className="text-xs text-zinc-600">{r.suggestedAction}</p>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
      <AdminCard title="AI assistant" subtitle="Requires LLM key">
        <AdminAsyncState loading={loading}>
          <p className="text-sm text-zinc-700">
            {data?.ai?.message ?? "AI no disponible."}
          </p>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
