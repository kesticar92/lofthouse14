"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

type Row = {
  id: string;
  reservation_code: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  status: string;
  channel: string;
  guests: number;
  payment_status: string;
  bucket: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminFrontDeskPage() {
  const [date, setDate] = useState(todayIso);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arrivals, setArrivals] = useState<Row[]>([]);
  const [departures, setDepartures] = useState<Row[]>([]);
  const [inHouse, setInHouse] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/front-desk?date=${encodeURIComponent(date)}`,
        { credentials: "include" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setArrivals((json as { arrivals?: Row[] }).arrivals ?? []);
      setDepartures((json as { departures?: Row[] }).departures ?? []);
      setInHouse((json as { in_house?: Row[] }).in_house ?? []);
    } catch {
      setError("No se pudo cargar el día.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(action: "check_in" | "check_out", code: string) {
    setBusy(code);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/front-desk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reservation_code: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFlash((json as { error?: string }).error ?? "Error");
        return;
      }
      setFlash(
        action === "check_in"
          ? `Check-in ${code}`
          : `Check-out ${code} · HK dirty + reseña stub`,
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  function Section({
    title,
    rows,
    mode,
  }: {
    title: string;
    rows: Row[];
    mode: "arrivals" | "departures" | "in_house";
  }) {
    return (
      <AdminCard title={title} subtitle={`${rows.length} · ${date}`}>
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin movimientos.</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {rows.map((r) => (
              <li
                key={`${mode}-${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {r.guest_name}{" "}
                    <span className="font-mono text-xs font-normal text-zinc-500">
                      {r.reservation_code}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {r.check_in} → {r.check_out} · {r.guests} huésp. ·{" "}
                    {r.channel} · {r.status} · pago {r.payment_status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/folio/${encodeURIComponent(r.reservation_code)}`}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-semibold dark:border-zinc-600"
                  >
                    Folio
                  </Link>
                  {mode === "arrivals" && r.status !== "checked_in" ? (
                    <button
                      type="button"
                      disabled={busy === r.reservation_code}
                      onClick={() => void act("check_in", r.reservation_code)}
                      className="rounded-full bg-teal-800 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      Check-in
                    </button>
                  ) : null}
                  {(mode === "departures" || mode === "in_house") &&
                  r.status === "checked_in" ? (
                    <button
                      type="button"
                      disabled={busy === r.reservation_code}
                      onClick={() => void act("check_out", r.reservation_code)}
                      className="rounded-full bg-amber-800 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      Check-out
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">FRONT DESK</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Llegadas, salidas e in-house del día · check-in/out rápido
          </p>
        </div>
        <label className="text-xs">
          Día
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
      </div>

      {flash ? (
        <p className="mt-3 text-sm font-medium text-teal-800 dark:text-teal-300">
          {flash}
        </p>
      ) : null}

      <AdminAsyncState loading={loading} error={error} onRetry={() => void load()}>
        <div className="mt-6 space-y-6">
          <Section title="Llegadas" rows={arrivals} mode="arrivals" />
          <Section title="Salidas" rows={departures} mode="departures" />
          <Section title="In-house" rows={inHouse} mode="in_house" />
        </div>
      </AdminAsyncState>
    </AdminShell>
  );
}
