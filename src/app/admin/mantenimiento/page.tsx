"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

export default function AdminMantenimientoPage() {
  const [tickets, setTickets] = useState<unknown[]>([]);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/maintenance");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        setTickets([]);
        return;
      }
      setTickets(data.tickets ?? []);
    } catch {
      setError("No se pudo cargar mantenimiento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTicket() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          blocks_availability: blocks,
          priority: "high",
        }),
      });
      setTitle("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide">MANTENIMIENTO</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tickets ops. Si blocks_availability=true → OUT_OF_SERVICE en
          availability.
        </p>
      </div>
      <AdminCard title="Nuevo ticket">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Aire acondicionado LOFT 03"
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={blocks}
              onChange={(e) => setBlocks(e.target.checked)}
            />
            Bloquea availability
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void createTicket()}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            Crear
          </button>
        </div>
      </AdminCard>
      <AdminCard title="Tickets">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && tickets.length === 0}
          emptyMessage="Sin tickets. Crea uno arriba."
          onRetry={() => void load()}
        >
          <pre className="max-h-80 overflow-auto text-xs">
            {JSON.stringify(tickets, null, 2)}
          </pre>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
