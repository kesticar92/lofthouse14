"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  hasLocalInventarios,
  migrateLocalInventariosToServer,
  type InventarioMigrationReport,
} from "./migrate";
import { inventariosKeys } from "./hooks";

/**
 * Banner que aparece cuando hay inventarios en localStorage (incluidas fotos
 * en base64) y permite subirlos al servidor + Supabase Storage en una sola
 * acción.
 */
export function MigrateLocalInventariosBanner() {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<InventarioMigrationReport | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPending(hasLocalInventarios());
  }, []);

  if (!pending || dismissed) return null;

  async function handleMigrate() {
    setRunning(true);
    try {
      const r = await migrateLocalInventariosToServer();
      setReport(r);
      qc.invalidateQueries({ queryKey: inventariosKeys.all });
      if (r.errors.length === 0) {
        setTimeout(() => setDismissed(true), 8000);
      }
    } catch (err) {
      setReport({
        scanned: 0,
        uploaded: 0,
        fotosUploaded: 0,
        fotosFailed: 0,
        errors: [
          {
            localId: "(global)",
            message: err instanceof Error ? err.message : "Error desconocido",
          },
        ],
      });
    } finally {
      setRunning(false);
      setPending(hasLocalInventarios());
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-300/30 dark:bg-amber-300/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Tienes inventarios guardados solo en este navegador (con fotos en
            base64).
          </p>
          <p className="mt-0.5 text-amber-800/80 dark:text-amber-100/80">
            Migra ahora: los datos van a la base de datos y las fotos a
            Supabase Storage. Puede tardar un minuto según la cantidad de
            fotos.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleMigrate}
            disabled={running}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-amber-800 disabled:cursor-progress disabled:opacity-60"
          >
            {running ? "Migrando…" : "Migrar al servidor"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={running}
            className="rounded-md border border-amber-700/30 px-3 py-1.5 text-xs text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:text-amber-100 dark:hover:bg-amber-300/10"
          >
            Después
          </button>
        </div>
      </div>

      {report ? (
        <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
          <p>
            Encontrados {report.scanned} · Subidos {report.uploaded} · Fotos OK{" "}
            {report.fotosUploaded} · Fotos fallidas {report.fotosFailed} ·
            Errores {report.errors.length}
          </p>
          {report.errors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-rose-700 dark:text-rose-300">
              {report.errors.map((e) => (
                <li key={e.localId}>
                  <span className="font-mono">{e.localId}</span>: {e.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
