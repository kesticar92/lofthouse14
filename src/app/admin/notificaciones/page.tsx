"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  href?: string;
  level?: string;
  source?: string;
};

export default function AdminNotificacionesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === "unread" ? "?unread=1" : "";
      const res = await fetch(`/api/admin/notifications${qs}`, {
        credentials: "include",
      });
      const j = (await res.json()) as { notifications?: Row[] };
      setItems(j.notifications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function markOne(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
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
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">AVISOS</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Centro de notificaciones · Supabase + ops local
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              filter === "unread"
                ? "bg-amber-800 text-white"
                : "border border-zinc-300 dark:border-zinc-600",
            )}
          >
            No leídas
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              filter === "all"
                ? "bg-amber-800 text-white"
                : "border border-zinc-300 dark:border-zinc-600",
            )}
          >
            Todas
          </button>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAll()}
              className="rounded-full border border-amber-800/40 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-400"
            >
              Marcar todas leídas
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <AdminCard
          title={filter === "unread" ? "Pendientes" : "Historial"}
          subtitle={loading ? "Cargando…" : `${items.length} avisos`}
        >
          {loading ? (
            <p className="text-sm text-zinc-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin avisos.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void markOne(n.id)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition",
                      n.read
                        ? "border-black/5 bg-white/50 opacity-75 dark:border-white/5 dark:bg-zinc-900/40"
                        : "border-amber-900/25 bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-500/15",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {n.title}
                      </p>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                        {n.level ?? "info"} · {n.source ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {new Date(n.created_at).toLocaleString("es-CO")}
                      {n.href ? (
                        <>
                          {" · "}
                          <Link
                            href={n.href}
                            className="underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </AdminShell>
  );
}
