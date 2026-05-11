"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Row = { id: string; title: string; message: string; read: boolean; created_at: string };

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?unread=1", {
        credentials: "include",
      });
      const j = (await res.json()) as { notifications?: Row[] };
      setItems(j.notifications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 120_000);
    return () => clearInterval(t);
  }, [refresh]);

  const unread = items.filter((n) => !n.read).length;

  async function markOne(id: string) {
    await fetch(`/api/admin/notifications/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    void refresh();
  }

  async function markAll() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      credentials: "include",
    });
    void refresh();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-zinc-700 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5a5 5 0 0 0-5 5v3l-2 3h14l-2-3V10a5 5 0 0 0-5-5z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-[60] cursor-default bg-black/20 dark:bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-full z-[70] mt-2 w-[min(100vw-2rem,380px)] rounded-2xl border border-black/10 bg-[#f2f0eb] p-3 shadow-2xl dark:border-white/10 dark:bg-[#1a1814]",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Avisos
              </p>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAll()}
                  className="text-[11px] font-semibold text-amber-800 underline dark:text-amber-400"
                >
                  Marcar leídas
                </button>
              ) : null}
            </div>
            {loading ? (
              <p className="text-sm text-zinc-500">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin avisos nuevos.</p>
            ) : (
              <ul className="max-h-[min(60vh,320px)] space-y-2 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void markOne(n.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                        n.read
                          ? "border-black/5 bg-white/40 opacity-70 dark:border-white/5 dark:bg-zinc-900/40"
                          : "border-amber-900/20 bg-amber-500/10 dark:border-amber-400/25 dark:bg-amber-500/15",
                      )}
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {n.title}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-300">
                        {n.message}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-col gap-1.5 text-center">
              <Link
                href="/admin/usuarios"
                className="text-xs font-semibold text-amber-900 underline dark:text-amber-400"
                onClick={() => setOpen(false)}
              >
                Ir a usuarios (aprobar accesos)
              </Link>
              <Link
                href="/admin/aseos"
                className="text-xs font-semibold text-zinc-600 underline dark:text-zinc-400"
                onClick={() => setOpen(false)}
              >
                Ir a operación de aseo
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
