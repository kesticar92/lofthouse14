"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { formatCOP } from "@/lib/pricing";

function defaultFrom() {
  return new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminReportesPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<{
    metrics?: Record<string, number | string>;
    channels?: Array<{
      channel: string;
      reservations: number;
      revenue: number;
      room_nights: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from, to });
      const res = await fetch(`/api/admin/reports?${qs}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string }).error ?? `Error ${res.status}`);
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("No se pudo cargar reportes.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const csvUrl = useMemo(
    () =>
      `/api/admin/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=excel`,
    [from, to],
  );

  const metrics = data?.metrics ?? {};
  const channels = data?.channels ?? [];

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">REPORTES</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Ocupación, revenue y canal · CSV Excel-friendly (UTF-8 BOM + ;).
          </p>
        </div>
        <a
          href={csvUrl}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
        >
          Export CSV (Excel)
        </a>
      </div>

      <AdminCard title="Filtros de fecha" subtitle="from inclusivo · to exclusivo/fin">
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

      <AdminCard title="Métricas" subtitle="Occupancy / ADR / RevPAR">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && Object.keys(metrics).length === 0}
          emptyMessage="Sin métricas en el rango."
          onRetry={() => void load()}
        >
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            {(
              [
                ["occupancyRate", "Ocupación"],
                ["roomRevenue", "Revenue"],
                ["adr", "ADR"],
                ["revpar", "RevPAR"],
                ["roomNightsSold", "Room nights"],
                ["arrivals", "Llegadas"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {label}
                </dt>
                <dd className="mt-1 font-semibold">
                  {key === "occupancyRate"
                    ? `${(Number(metrics[key] ?? 0) * 100).toFixed(1)}%`
                    : key === "roomRevenue" || key === "adr" || key === "revpar"
                      ? formatCOP(Number(metrics[key] ?? 0))
                      : String(metrics[key] ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        </AdminAsyncState>
      </AdminCard>

      <AdminCard title="Por canal" subtitle="Revenue stub por channel/source">
        <AdminAsyncState
          loading={loading}
          empty={!loading && channels.length === 0}
          emptyMessage="Sin reservas en el rango."
        >
          <ul className="space-y-2 text-sm">
            {channels.map((c) => (
              <li
                key={c.channel}
                className="flex justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 dark:border-white/10"
              >
                <span className="font-medium">{c.channel}</span>
                <span className="text-xs text-zinc-500">
                  {c.reservations} res · {c.room_nights} rn ·{" "}
                  {formatCOP(c.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
