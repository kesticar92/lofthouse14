"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AdminShell,
  AdminCard,
  ADMIN_NAV,
} from "@/components/admin/admin-shell";
import { exportAll, importAllFromFile } from "@/lib/storage";
import { apiClient } from "@/lib/api/client";
import { useCotizaciones } from "@/features/cotizaciones/hooks";
import type { InventarioGuardado } from "@/lib/inventarios-store";
import { KEYS, safeGet } from "@/lib/storage";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type CleaningTaskLite = { id: string; status: string };

export default function AdminHomePage() {
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cotizaciones desde el servidor (React Query)
  const cotizacionesQ = useCotizaciones();

  const aseosHoyQ = useQuery<CleaningTaskLite[], Error>({
    queryKey: ["admin-home", "aseos-hoy"],
    queryFn: async () => {
      try {
        const res = await apiClient<{ tasks: CleaningTaskLite[] }>(
          `/api/admin/cleaning-tasks?date=${todayISO()}`,
        );
        return Array.isArray(res?.tasks) ? res.tasks : [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  // Inventarios: hasta que migremos a Postgres seguimos contando los locales
  // (no es ideal, pero el dashboard no debe romper). Cuando exista la tabla
  // inventario_revisiones cambiamos esta lectura por una API.
  const localInventarios = safeGet<InventarioGuardado[]>(KEYS.inventarios, []);

  const aseosHoyData = aseosHoyQ.data ?? [];
  const stats = {
    cotizaciones: cotizacionesQ.data?.length ?? 0,
    inventarios: localInventarios.length,
    aseosHoy: aseosHoyData.length,
    aseosHoyPendientes: aseosHoyData.filter((a) => a.status !== "done").length,
  };

  function handleExport() {
    exportAll();
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importAllFromFile(file);
      setImportMsg("Respaldo importado correctamente.");
    } catch {
      setImportMsg(
        "No se pudo leer el archivo. Verifica que sea un JSON válido.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setImportMsg(null), 4000);
    }
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          BIENVENIDO AL PANEL
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Todo lo que necesitas para operar LOFTHOUSE 14 sin complicaciones:
          cotiza, revisa el inventario y registra los aseos del día.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cotizaciones guardadas" value={stats.cotizaciones} />
        <StatCard label="Inventarios registrados" value={stats.inventarios} />
        <StatCard label="Aseos programados hoy" value={stats.aseosHoy} />
        <StatCard
          label="Aseos pendientes hoy"
          value={stats.aseosHoyPendientes}
          highlight={stats.aseosHoyPendientes > 0}
        />
      </div>

      <AdminCard
        title="Accesos rápidos"
        subtitle="Elige qué quieres hacer ahora."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_NAV.filter((n) => n.href !== "/admin").map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="group flex items-start gap-3 rounded-xl border border-black/10 bg-white/60 p-4 transition hover:border-amber-900/30 hover:bg-white dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-amber-400/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/10 text-xl text-amber-900 dark:bg-amber-400/10 dark:text-amber-300">
                {n.icon}
              </span>
              <div>
                <h3 className="font-semibold">{n.label}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {n.desc}
                </p>
                <span className="mt-2 inline-flex text-xs font-semibold uppercase tracking-wider text-amber-800 group-hover:underline dark:text-amber-400">
                  Abrir →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Respaldo de datos"
        subtitle="Toda la información se guarda en este dispositivo. Descarga un respaldo cada tanto y súbelo si cambias de computador."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900"
            >
              Descargar respaldo
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
            >
              Importar respaldo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleImportFile}
            />
          </div>
        }
      >
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
          <li>
            Los archivos de respaldo son JSON y puedes guardarlos en Drive o
            WhatsApp.
          </li>
          <li>Al importar, los datos del respaldo reemplazan los actuales.</li>
          <li>
            Si cambias de navegador o de dispositivo, importa tu último respaldo
            para no perder nada.
          </li>
        </ul>
        {importMsg && (
          <p className="mt-3 rounded-lg bg-amber-200/50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
            {importMsg}
          </p>
        )}
      </AdminCard>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md ${
        highlight
          ? "border-amber-800/30 bg-amber-200/30 dark:border-amber-400/30 dark:bg-amber-400/10"
          : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-900/60"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl tracking-wide">{value}</p>
    </div>
  );
}
