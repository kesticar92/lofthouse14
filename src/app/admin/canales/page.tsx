"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

type Adapter = { id: string; displayName: string; isStub: boolean };

export default function AdminCanalesPage() {
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [logs, setLogs] = useState<unknown[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importCheckIn, setImportCheckIn] = useState("");
  const [importCheckOut, setImportCheckOut] = useState("");
  const [importGuest, setImportGuest] = useState("OTA Guest");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/channels");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? `Error ${res.status}`,
        );
        setAdapters([]);
        setLogs([]);
        return;
      }
      setAdapters(data.adapters ?? []);
      setLogs(data.logs ?? []);
    } catch {
      setError("No se pudo cargar canales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const inDate = new Date(Date.now() + 21 * 86400000)
      .toISOString()
      .slice(0, 10);
    const outDate = new Date(Date.now() + 24 * 86400000)
      .toISOString()
      .slice(0, 10);
    setImportCheckIn(inDate);
    setImportCheckOut(outDate);
  }, [load]);

  async function simulate(channel: string, action: "pull" | "import_reservation") {
    setMsg(null);
    const res = await fetch("/api/admin/channels/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        action,
        check_in: importCheckIn || undefined,
        check_out: importCheckOut || undefined,
        guest_name: importGuest || undefined,
        idempotency_key: `ui-${channel}-${action}-${Date.now()}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? `Error ${res.status}`);
    } else if (action === "import_reservation" && data.reservation) {
      setMsg(
        `Importada ${data.reservation.reservation_code} · pago ${data.payment?.status ?? "pending"} (stub)`,
      );
    } else {
      setMsg(data.result?.message ?? data.note ?? "OK");
    }
    await load();
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">CANALES</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Channel manager — adapters stub. TODO: REAL INTEGRATION REQUIRED para
          OTAs.
        </p>
      </div>
      <AdminCard
        title="Importar reserva (simulador)"
        subtitle="Crea reserva + payment pending en store local"
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs">
            Check-in
            <input
              type="date"
              value={importCheckIn}
              onChange={(e) => setImportCheckIn(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="text-xs">
            Check-out
            <input
              type="date"
              value={importCheckOut}
              onChange={(e) => setImportCheckOut(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="text-xs">
            Huésped
            <input
              value={importGuest}
              onChange={(e) => setImportGuest(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
        </div>
      </AdminCard>
      <AdminCard title="Adapters" subtitle="Simulador admin">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && adapters.length === 0}
          emptyMessage="No hay adapters registrados."
          onRetry={() => void load()}
        >
          <ul className="space-y-2">
            {adapters.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <span>
                  {a.displayName}{" "}
                  {a.isStub ? (
                    <span className="text-xs text-amber-700">(stub)</span>
                  ) : (
                    <span className="text-xs text-emerald-700">(live/local)</span>
                  )}
                </span>
                <span className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void simulate(a.id, "pull")}
                    className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold"
                  >
                    Simular sync
                  </button>
                  {a.id !== "direct" && a.id !== "ical" ? (
                    <button
                      type="button"
                      onClick={() => void simulate(a.id, "import_reservation")}
                      className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                    >
                      Import reservation
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {msg ? <p className="mt-3 text-xs text-zinc-600">{msg}</p> : null}
        </AdminAsyncState>
      </AdminCard>
      <AdminCard title="Últimos logs" subtitle="channel_sync_logs">
        <AdminAsyncState
          loading={loading}
          error={null}
          empty={!loading && logs.length === 0}
          emptyMessage="Sin logs de sync todavía. Usa «Simular sync»."
        >
          <pre className="max-h-64 overflow-auto text-xs">
            {JSON.stringify(logs, null, 2)}
          </pre>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
