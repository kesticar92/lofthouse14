"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";
import { buildSeedCatalog } from "@/lib/catalog/seed";

type Ticket = {
  id?: string;
  title?: string;
  status?: string;
  priority?: string;
  blocks_availability?: boolean;
  legacyPropertyId?: string | null;
  roomId?: string | null;
  created_at?: string;
};

export default function AdminMantenimientoPage() {
  const rooms = useMemo(
    () =>
      buildSeedCatalog().rooms.filter(
        (r) => r.status !== "storage" && r.status !== "inactive",
      ),
    [],
  );

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(true);
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const start = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    setCheckIn(start);
    setCheckOut(end);
  }, []);

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
    if (blocks && (!roomId || !checkIn || !checkOut || checkOut <= checkIn)) {
      setMsg("Para OUT_OF_SERVICE indica unidad y fechas válidas.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          blocks_availability: blocks,
          priority: "high",
          room_id: roomId || undefined,
          legacy_property_id: roomId || undefined,
          check_in: checkIn || undefined,
          check_out: checkOut || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? `Error ${res.status}`);
        return;
      }
      setTitle("");
      setMsg(
        blocks
          ? "Ticket creado · OUT_OF_SERVICE reflejado en availability (local/stub)."
          : "Ticket creado.",
      );
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
          Tickets ops. Si bloquea availability → OUT_OF_SERVICE en el motor de
          disponibilidad.
        </p>
      </div>
      <AdminCard title="Nuevo ticket">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Aire acondicionado LOFT 03"
            className="rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
          <label className="text-xs">
            Unidad
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} · {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-xs">
            <input
              type="checkbox"
              checked={blocks}
              onChange={(e) => setBlocks(e.target.checked)}
            />
            Bloquea availability (OUT_OF_SERVICE)
          </label>
          <label className="text-xs">
            Desde
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
          <label className="text-xs">
            Hasta (exclusivo)
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createTicket()}
          className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          Crear ticket
        </button>
        {msg ? <p className="mt-2 text-xs text-zinc-600">{msg}</p> : null}
      </AdminCard>
      <AdminCard title="Tickets">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && tickets.length === 0}
          emptyMessage="Sin tickets. Crea uno arriba."
          onRetry={() => void load()}
        >
          <ul className="space-y-2">
            {tickets.map((t, i) => (
              <li
                key={t.id ?? i}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <p className="font-semibold">{t.title}</p>
                <p className="text-xs text-zinc-500">
                  {t.status ?? "open"} · {t.priority ?? "—"}
                  {t.blocks_availability ? " · OOS" : ""}
                  {t.legacyPropertyId || t.roomId
                    ? ` · ${t.legacyPropertyId ?? t.roomId}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
