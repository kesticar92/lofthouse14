"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { TODOS_LOS_LOFTS } from "@/lib/inventory-catalog";
import {
  listarAseos,
  guardarAseo,
  eliminarAseo,
  TIPOS_ASEO,
  ESTADOS_ASEO,
  type AseoGuardado,
  type AseoEstado,
  type AseoTipo,
} from "@/lib/aseos-store";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function newId() {
  return "a_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function fmtHora(h?: string) {
  if (!h) return "—";
  return h;
}

export default function AseosPage() {
  const [fecha, setFecha] = useState<string>("");
  const [loft, setLoft] = useState<number>(1);
  const [tipo, setTipo] = useState<AseoTipo>("Entre huéspedes");
  const [hora, setHora] = useState<string>("");
  const [personal, setPersonal] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [aseos, setAseos] = useState<AseoGuardado[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setFecha(todayISO());
    setAseos(listarAseos());
  }, []);

  function reloadList() {
    setAseos(listarAseos());
  }

  function handleAgregar() {
    const nuevo: AseoGuardado = {
      id: newId(),
      creadoEn: new Date().toISOString(),
      fecha,
      loft,
      tipo,
      hora: hora || undefined,
      personal: personal.trim() || "—",
      estado: "Pendiente",
      notas: notas.trim() || undefined,
    };
    guardarAseo(nuevo);
    reloadList();
    setNotas("");
    setMsg("Aseo agregado al cronograma.");
    setTimeout(() => setMsg(null), 2500);
  }

  function cambiarEstado(id: string, estado: AseoEstado) {
    const item = aseos.find((a) => a.id === id);
    if (!item) return;
    const next: AseoGuardado = {
      ...item,
      estado,
      completadoEn: estado === "Hecho" ? new Date().toISOString() : undefined,
    };
    guardarAseo(next);
    reloadList();
  }

  function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este aseo del cronograma?")) return;
    eliminarAseo(id);
    reloadList();
  }

  const delDia = useMemo(
    () =>
      aseos
        .filter((a) => a.fecha === fecha)
        .sort((a, b) => (a.hora || "99:99").localeCompare(b.hora || "99:99")),
    [aseos, fecha],
  );

  const resumen = useMemo(() => {
    const r = { total: delDia.length, pendientes: 0, enProceso: 0, hechos: 0 };
    for (const a of delDia) {
      if (a.estado === "Pendiente") r.pendientes++;
      else if (a.estado === "En proceso") r.enProceso++;
      else if (a.estado === "Hecho") r.hechos++;
    }
    return r;
  }, [delDia]);

  const proximasFechas = useMemo(() => {
    const set = new Set(aseos.map((a) => a.fecha));
    return Array.from(set).filter((f) => f > fecha).sort().slice(0, 5);
  }, [aseos, fecha]);

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          ASEOS DEL DÍA
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Programa los aseos diarios, reparte el trabajo por loft y marca
          cuando quede listo. Sencillo y sin complicaciones.
        </p>
      </div>

      <AdminCard title="Programar un aseo">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Fecha">
            <input
              type="date"
              className={inputClass}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Field>
          <Field label="Loft">
            <select
              className={inputClass}
              value={loft}
              onChange={(e) => setLoft(parseInt(e.target.value, 10))}
            >
              {TODOS_LOS_LOFTS.map((l) => (
                <option key={l} value={l}>
                  {l === 4 ? "Loft 4 (bodega)" : `Loft ${l}`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de aseo">
            <select
              className={inputClass}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as AseoTipo)}
            >
              {TIPOS_ASEO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hora (opcional)">
            <input
              type="time"
              className={inputClass}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </Field>
          <Field label="Personal asignado">
            <input
              className={inputClass}
              value={personal}
              onChange={(e) => setPersonal(e.target.value)}
              placeholder="Nombre de quien lo realiza"
            />
          </Field>
          <Field label="Notas (opcional)">
            <input
              className={inputClass}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: cambiar ropa de cama, hay mascota, etc."
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAgregar}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900"
          >
            Agregar al cronograma
          </button>
        </div>

        {msg && (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {msg}
          </p>
        )}
      </AdminCard>

      <AdminCard
        title={`Cronograma del ${fecha || "día seleccionado"}`}
        subtitle="Marca cada aseo como «En proceso» o «Hecho» para que todos vean el avance del día."
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Total" value={resumen.total} />
          <StatChip label="Pendientes" value={resumen.pendientes} color="amber" />
          <StatChip label="En proceso" value={resumen.enProceso} color="blue" />
          <StatChip label="Hechos" value={resumen.hechos} color="green" />
        </div>

        {delDia.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay aseos programados para este día. Agrega uno arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {delDia.map((a) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                  a.estado === "Hecho"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : a.estado === "En proceso"
                      ? "border-sky-500/30 bg-sky-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                      {fmtHora(a.hora)}
                    </span>{" "}
                    · Loft {a.loft} · {a.tipo}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {a.personal}
                    {a.notas ? ` — ${a.notas}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={smallSelect}
                    value={a.estado}
                    onChange={(e) => cambiarEstado(a.id, e.target.value as AseoEstado)}
                  >
                    {ESTADOS_ASEO.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleEliminar(a.id)}
                    className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-500/10 dark:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {proximasFechas.length > 0 && (
        <AdminCard title="Próximas fechas programadas">
          <div className="flex flex-wrap gap-2">
            {proximasFechas.map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFecha(f)}
                className="rounded-full border border-black/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200"
              >
                {f}
              </button>
            ))}
          </div>
        </AdminCard>
      )}
    </AdminShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";
const smallSelect =
  "rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: "green" | "amber" | "blue";
}) {
  const palette: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    blue: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
  return (
    <div
      className={`rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/10 ${
        color ? palette[color] : "bg-white/60 dark:bg-zinc-900/50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="font-display text-xl tracking-wide">{value}</p>
    </div>
  );
}
