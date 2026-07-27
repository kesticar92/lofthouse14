"use client";

import { useMemo, useState } from "react";
import type { IcalSourceRow, PropertyRow } from "@/lib/pms/types";
import { cn } from "@/lib/cn";

function truncateUrl(s: string, max = 56): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 3)}…`;
}

function fmtSync(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function PmsCalendarHub({
  properties,
  sources,
  selectedPropertyId,
  onSelectPropertyId,
  exportUrl,
  busy,
  onSyncAll,
  onAddImportUrl,
  onSyncOneSource,
  onDeleteSource,
  onCopyExport,
  onOpenExport,
  onRegenerateToken,
}: {
  properties: PropertyRow[];
  sources: IcalSourceRow[];
  selectedPropertyId: string;
  onSelectPropertyId: (id: string) => void;
  exportUrl: string;
  busy: boolean;
  onSyncAll: () => void | Promise<void>;
  onAddImportUrl: (url: string) => Promise<{ ok: boolean; error?: string }>;
  onSyncOneSource: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onDeleteSource: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onCopyExport: () => void | Promise<void>;
  onOpenExport: () => void;
  onRegenerateToken: () => void | Promise<void>;
}) {
  const [newUrl, setNewUrl] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const sourcesHere = useMemo(
    () =>
      sources
        .filter((s) => s.property_id === selectedPropertyId)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [sources, selectedPropertyId],
  );

  const selectedName =
    properties.find((p) => p.id === selectedPropertyId)?.name ?? "—";

  async function addUrl() {
    const url = newUrl.trim();
    if (!url || !selectedPropertyId) return;
    setRowBusy("__add__");
    const r = await onAddImportUrl(url);
    setRowBusy(null);
    if (r.ok) setNewUrl("");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Propiedad (hub de calendarios)
          </label>
          <select
            className="mt-1 w-full max-w-xl rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/80"
            value={selectedPropertyId}
            onChange={(e) => onSelectPropertyId(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Todas las URLs de importación Airbnb de <strong>{selectedName}</strong>{" "}
            alimentan <strong>la misma</strong> propiedad en el PMS. El iCal de
            exportación (abajo) reúne reservas y bloqueos de{" "}
            <strong>todas las fuentes</strong> guardadas aquí (Airbnb, Booking,
            manual, etc.) para que puedas pegar <strong>la misma URL</strong> en
            cada anuncio de Airbnb y bloqueen fechas de forma coherente.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSyncAll()}
          className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-900"
        >
          Sincronizar todos los iCal
        </button>
      </div>

      <section className="rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Importar (Airbnb — solo lectura)
        </h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Añade un enlace por cada publicación de Airbnb (incluidas varias del
          mismo loft). El cron y «Sincronizar» traen los eventos a esta
          propiedad.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="w-full flex-1 rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/80"
            placeholder="https://www.airbnb.com/calendar/ical/…"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={!selectedPropertyId}
          />
          <button
            type="button"
            disabled={busy || rowBusy !== null || !selectedPropertyId}
            aria-busy={rowBusy === "__add__"}
            onClick={() => void addUrl()}
            className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider dark:border-white/10 dark:bg-zinc-800"
          >
            Añadir y sincronizar
          </button>
        </div>

        {sourcesHere.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No hay enlaces iCal para esta propiedad. Añade el primero arriba.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-black/10 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">URL</th>
                  <th className="py-2 pr-2">Última sync</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sourcesHere.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/5"
                  >
                    <td className="py-2 pr-2 align-top text-zinc-500">{i + 1}</td>
                    <td className="max-w-[280px] py-2 pr-2 align-top">
                      <span className="break-all font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                        {truncateUrl(s.url, 72)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-2 align-top text-zinc-600 dark:text-zinc-300">
                      {fmtSync(s.last_sync)}
                    </td>
                    <td className="py-2 align-top text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          disabled={busy || rowBusy !== null}
                          onClick={() => {
                            void (async () => {
                              setRowBusy(s.id);
                              await onSyncOneSource(s.id);
                              setRowBusy(null);
                            })();
                          }}
                          className="rounded-full border border-black/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider dark:border-white/10"
                        >
                          Sync
                        </button>
                        <button
                          type="button"
                          disabled={busy || rowBusy !== null}
                          onClick={() => {
                            if (
                              !confirm(
                                "¿Eliminar este enlace iCal? No borra reservas ya importadas.",
                              )
                            ) {
                              return;
                            }
                            void (async () => {
                              setRowBusy(s.id);
                              await onDeleteSource(s.id);
                              setRowBusy(null);
                            })();
                          }}
                          className="rounded-full border border-red-500/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-800 dark:text-red-300"
                        >
                          Quitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-500">
          Los datos del huésped no vienen en el iCal de Airbnb; solo fechas y
          estado aproximado (reservado vs no disponible).
        </p>
      </section>

      <section className="rounded-xl border border-amber-900/20 bg-amber-500/5 p-4 dark:border-amber-400/25 dark:bg-amber-500/10">
        <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
          Exportar (un solo iCal consolidado)
        </h3>
        <p className="mt-1 text-xs text-amber-950/90 dark:text-amber-50/90">
          Esta URL incluye <strong>todas</strong> las reservas activas y bloqueos
          de <strong>{selectedName}</strong> en el PMS (cualquier OTA o manual).
          Pégala en «Importar calendario» en <strong>cada</strong> anuncio de
          Airbnb (u otra OTA que acepte iCal) para que bloqueen las mismas
          fechas. No sustituye la lectura desde Airbnb: sigue siendo solo
          bloqueo con delay de minutos.
        </p>
        <div className="mt-3 break-all rounded-lg border border-black/10 bg-white/80 px-3 py-2 font-mono text-[11px] text-zinc-900 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100">
          {exportUrl || "—"}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!exportUrl || busy}
            onClick={() => void onCopyExport()}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider dark:border-white/10 dark:bg-zinc-800"
          >
            Copiar URL
          </button>
          <button
            type="button"
            disabled={!exportUrl}
            onClick={onOpenExport}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider dark:border-white/10 dark:bg-zinc-800"
          >
            Abrir .ics
          </button>
          <button
            type="button"
            disabled={!selectedPropertyId || busy}
            onClick={() => void onRegenerateToken()}
            className={cn(
              "rounded-full border border-amber-900/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-950 dark:border-amber-400/40 dark:text-amber-200",
            )}
          >
            Regenerar token
          </button>
        </div>
      </section>
    </div>
  );
}
