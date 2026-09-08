"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

function defaultFrom() {
  return new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAnalyticsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<{
    metrics?: Record<string, number | string>;
    recommendations?: Array<{
      title: string;
      suggestedAction: string;
      rationale?: string;
      confidence?: string;
      occupancyBand?: string;
      impactHint?: string;
      autoApply?: boolean;
    }>;
    ai?: {
      message?: string;
      ok?: boolean;
      answer?: string;
      disclaimer?: string;
      mode?: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    "¿Qué tarifas conviene revisar la próxima semana?",
  );
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from, to });
      const res = await fetch(`/api/admin/analytics?${qs}`);
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
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function askAssistant() {
    setAiBusy(true);
    setAiReply(null);
    try {
      const res = await fetch("/api/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          context: JSON.stringify(data?.metrics ?? {}),
        }),
      });
      const json = await res.json();
      setAiReply(
        [
          json.disclaimer,
          json.ai?.answer ?? json.ai?.message ?? JSON.stringify(json),
          "(autoApply=false)",
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
    } catch {
      setAiReply("Error al consultar assistant.");
    } finally {
      setAiBusy(false);
    }
  }

  const metrics = data?.metrics ?? {};
  const recs = data?.recommendations ?? [];

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">ANALYTICS</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Reportes, recomendaciones de revenue (sin auto-apply) y AI assistant.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/reportes"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
          >
            Reportes avanzados
          </Link>
          <Link
            href="/admin/saas"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
          >
            Module flags
          </Link>
          <a
            href={`/api/admin/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=csv`}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
          >
            Export CSV
          </a>
        </div>
      </div>
      <AdminCard title="Rango" subtitle="Filtro de fechas">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs">
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs">
            Hasta
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            Aplicar
          </button>
        </div>
      </AdminCard>
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
      <AdminCard title="Revenue recommendations" subtitle="autoApply=false · heurística ocupación">
        <AdminAsyncState
          loading={loading}
          empty={!loading && recs.length === 0}
          emptyMessage="Sin recomendaciones en este momento."
        >
          <ul className="space-y-2 text-sm">
            {recs.map((r, i) => (
              <li
                key={i}
                className="rounded border border-black/10 p-3 dark:border-white/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{r.title}</strong>
                  {r.occupancyBand ? (
                    <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] uppercase tracking-wider dark:border-zinc-600">
                      {r.occupancyBand}
                    </span>
                  ) : null}
                  {r.confidence ? (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      conf {r.confidence}
                    </span>
                  ) : null}
                </div>
                {r.rationale ? (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {r.rationale}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {r.suggestedAction}
                </p>
                {r.impactHint ? (
                  <p className="mt-1 text-[11px] italic text-zinc-500">
                    {r.impactHint}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  autoApply=false
                </p>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
      <AdminCard
        title="AI assistant"
        subtitle="OPENAI_API_KEY → live; else stub. Sin auto-apply."
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button
          type="button"
          disabled={aiBusy}
          onClick={() => void askAssistant()}
          className="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {aiBusy ? "Consultando…" : "Preguntar"}
        </button>
        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
          {aiReply ??
            data?.ai?.answer ??
            data?.ai?.message ??
            "AI no disponible."}
        </p>
        {data?.ai?.disclaimer ? (
          <p className="mt-2 text-xs text-zinc-500">{data.ai.disclaimer}</p>
        ) : null}
      </AdminCard>
    </AdminShell>
  );
}
