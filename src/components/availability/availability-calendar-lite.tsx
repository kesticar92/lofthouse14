"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mergeStayDraft, readStayDraft } from "@/lib/stay-draft";

type Night = {
  date: string;
  available: boolean;
  available_count: number;
  total_active: number;
};

type CalendarResponse = {
  nights?: Night[];
  summary?: { available_nights: number; blocked_nights: number };
  mode?: string;
  error?: string;
};

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** UI ligera: noches disponibles vs bloqueadas (API calendario público). */
export function AvailabilityCalendarLite({
  category,
}: {
  category?: string;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(today);
  const [nights, setNights] = useState<Night[]>([]);
  const [summary, setSummary] = useState<{
    available_nights: number;
    blocked_nights: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("");

  const toExclusive = addDaysIso(from, 21);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        from,
        to: toExclusive,
        guests: "2",
      });
      if (category) qs.set("category", category);
      const res = await fetch(`/api/public/availability/calendar?${qs}`);
      const data = (await res.json().catch(() => ({}))) as CalendarResponse;
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        setNights([]);
        return;
      }
      setNights(data.nights ?? []);
      setSummary(data.summary ?? null);
      setMode(data.mode ?? "");
    } catch {
      setError("No se pudo cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  }, [from, toExclusive, category]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectRange(start: string) {
    const end = addDaysIso(start, 2);
    mergeStayDraft({
      ...(readStayDraft() ?? {}),
      checkIn: start,
      checkOut: end,
      step: 1,
    });
  }

  return (
    <section className="mt-14 border-t border-zinc-200/80 pt-10 dark:border-zinc-800">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
            Disponibilidad
          </h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Noches libres vs bloqueadas (motor Fase 3). Elige un día para
            llevar fechas al banner / RESERVAR.
          </p>
        </div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Desde
          <input
            type="date"
            value={from}
            min={today}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Cargando calendario…</p>
      ) : null}
      {error ? (
        <p className="mt-6 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {nights.map((n) => (
              <button
                key={n.date}
                type="button"
                title={
                  n.available
                    ? `${n.date}: ${n.available_count}/${n.total_active} libres`
                    : `${n.date}: bloqueada`
                }
                onClick={() => {
                  if (n.available) selectRange(n.date);
                }}
                disabled={!n.available}
                className={
                  n.available
                    ? "min-w-[3.25rem] rounded-lg border border-emerald-700/30 bg-emerald-50 px-2 py-2 text-center text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                    : "min-w-[3.25rem] cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100/80 px-2 py-2 text-center text-[11px] font-semibold text-zinc-400 line-through dark:border-zinc-700 dark:bg-zinc-900/60"
                }
              >
                <span className="block tabular-nums">
                  {n.date.slice(8)}
                </span>
                <span className="block text-[9px] font-normal uppercase tracking-wide opacity-80">
                  {n.available ? "ok" : "x"}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            {summary ? (
              <span>
                {summary.available_nights} libres · {summary.blocked_nights}{" "}
                bloqueadas
                {mode ? ` · ${mode}` : ""}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-500/40" />{" "}
              Disponible
              <span className="ml-2 h-3 w-3 rounded bg-zinc-200 dark:bg-zinc-700" />{" "}
              Bloqueada
            </span>
            <Link
              href="/#reservas"
              className="font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-400"
            >
              Ir a RESERVAR →
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
