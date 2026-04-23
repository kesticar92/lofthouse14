"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import {
  TODOS_LOS_LOFTS,
  getCatalogo,
  itemNoAplica,
  ESTADOS,
  FUNCIONA_OPCIONES,
  type EstadoItem,
  type Funciona,
} from "@/lib/inventory-catalog";
import {
  listarInventarios,
  guardarInventario,
  eliminarInventario,
  type InventarioGuardado,
  type InventarioItemResultado,
} from "@/lib/inventarios-store";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function newId() {
  return "i_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function buildEmpty(loft: number): InventarioItemResultado[] {
  const catalogo = getCatalogo(loft);
  return catalogo.map((c) => {
    const noAplica = itemNoAplica(loft, c.item);
    return {
      orden: c.orden,
      zona: c.zona,
      item: c.item,
      estado: noAplica ? "No aplica" : "",
      funciona: noAplica ? "No aplica" : "",
      detalles: "",
      requiereAtencion: false,
    };
  });
}

export default function InventarioPage() {
  const [loft, setLoft] = useState<number>(1);
  const [persona, setPersona] = useState("");
  const [fecha, setFecha] = useState<string>("");
  const [items, setItems] = useState<InventarioItemResultado[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [guardados, setGuardados] = useState<InventarioGuardado[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [filtroZona, setFiltroZona] = useState<string>("Todas");

  useEffect(() => {
    setFecha(todayISO());
    setItems(buildEmpty(1));
    setGuardados(listarInventarios());
  }, []);

  function cambiarLoft(l: number) {
    setLoft(l);
    setEditId(null);
    setItems(buildEmpty(l));
    setFiltroZona("Todas");
  }

  function setItem(idx: number, patch: Partial<InventarioItemResultado>) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], ...patch };
      item.requiereAtencion =
        item.estado === "Ausente" ||
        item.estado === "Dañado" ||
        item.funciona === "No";
      next[idx] = item;
      return next;
    });
  }

  const totales = useMemo(() => {
    const t = {
      marcados: 0,
      presente: 0,
      ausente: 0,
      danado: 0,
      noAplica: 0,
      funcionaNo: 0,
      atencion: 0,
    };
    for (const it of items) {
      if (it.estado !== "") t.marcados++;
      if (it.estado === "Presente") t.presente++;
      if (it.estado === "Ausente") t.ausente++;
      if (it.estado === "Dañado") t.danado++;
      if (it.estado === "No aplica") t.noAplica++;
      if (it.funciona === "No") t.funcionaNo++;
      if (it.requiereAtencion) t.atencion++;
    }
    return t;
  }, [items]);

  const zonas = useMemo(() => {
    const set = new Set(items.map((i) => i.zona));
    return ["Todas", ...Array.from(set)];
  }, [items]);

  const visibleIndices = useMemo(() => {
    return items
      .map((it, idx) => ({ it, idx }))
      .filter(({ it }) => filtroZona === "Todas" || it.zona === filtroZona)
      .map(({ idx }) => idx);
  }, [items, filtroZona]);

  function handleGuardar() {
    const inv: InventarioGuardado = {
      id: editId || newId(),
      creadoEn: new Date().toISOString(),
      loft,
      persona: persona.trim() || "—",
      fecha,
      items,
    };
    guardarInventario(inv);
    setGuardados(listarInventarios());
    setEditId(inv.id);
    setMsg("Inventario guardado.");
    setTimeout(() => setMsg(null), 3000);
  }

  function handleCargar(inv: InventarioGuardado) {
    setLoft(inv.loft);
    setPersona(inv.persona);
    setFecha(inv.fecha);
    setItems(inv.items);
    setEditId(inv.id);
    setFiltroZona("Todas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este registro de inventario?")) return;
    eliminarInventario(id);
    setGuardados(listarInventarios());
    if (editId === id) {
      setEditId(null);
      setItems(buildEmpty(loft));
    }
  }

  function handleNuevo() {
    setEditId(null);
    setItems(buildEmpty(loft));
    setPersona("");
    setFecha(todayISO());
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          INVENTARIO POR LOFT
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Revisa artículo por artículo cada loft. Marca estado y si funciona; los ítems que no apliquen se llenan solos.
        </p>
      </div>

      <AdminCard
        title="Datos del registro"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleNuevo}
              className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
            >
              Nuevo
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900"
            >
              Guardar inventario
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Loft">
            <select
              className={inputClass}
              value={loft}
              onChange={(e) => cambiarLoft(parseInt(e.target.value, 10))}
            >
              {TODOS_LOS_LOFTS.map((l) => (
                <option key={l} value={l}>
                  {l === 4 ? "Loft 4 (bodega)" : `Loft ${l}`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              className={inputClass}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Field>
          <Field label="Persona que revisa">
            <input
              className={inputClass}
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Nombre"
            />
          </Field>
          <Field label="Filtrar por zona">
            <select
              className={inputClass}
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
            >
              {zonas.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatChip label="Marcados" value={`${totales.marcados} / ${items.length}`} />
          <StatChip label="Presentes" value={totales.presente} color="green" />
          <StatChip label="Ausentes" value={totales.ausente} color="amber" />
          <StatChip label="Dañados" value={totales.danado} color="red" />
          <StatChip label="No aplica" value={totales.noAplica} />
          <StatChip label="Atención" value={totales.atencion} color="red" />
        </div>

        {msg && (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {msg}
          </p>
        )}
      </AdminCard>

      <AdminCard title={`Checklist — Loft ${loft}${loft === 4 ? " (bodega)" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-sm">
            <thead className="bg-black/5 text-[11px] uppercase tracking-wider text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Zona</th>
                <th className="px-2 py-2 text-left">Ítem</th>
                <th className="px-2 py-2 text-left">Estado</th>
                <th className="px-2 py-2 text-left">¿Funciona?</th>
                <th className="px-2 py-2 text-left">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {visibleIndices.map((idx) => {
                const it = items[idx];
                return (
                  <tr
                    key={idx}
                    className={
                      it.requiereAtencion
                        ? "bg-red-500/5"
                        : it.estado === "No aplica"
                          ? "opacity-60"
                          : ""
                    }
                  >
                    <td className="px-2 py-2 align-top text-zinc-500">{it.orden}</td>
                    <td className="px-2 py-2 align-top">
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] dark:bg-white/10">
                        {it.zona}
                      </span>
                    </td>
                    <td className="px-2 py-2 align-top font-medium">{it.item}</td>
                    <td className="px-2 py-2 align-top">
                      <select
                        className={smallSelect}
                        value={it.estado}
                        onChange={(e) =>
                          setItem(idx, { estado: e.target.value as EstadoItem })
                        }
                      >
                        <option value="">—</option>
                        {ESTADOS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <select
                        className={smallSelect}
                        value={it.funciona}
                        onChange={(e) =>
                          setItem(idx, { funciona: e.target.value as Funciona })
                        }
                      >
                        <option value="">—</option>
                        {FUNCIONA_OPCIONES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <input
                        className={smallInput}
                        value={it.detalles}
                        onChange={(e) => setItem(idx, { detalles: e.target.value })}
                        placeholder={/observaciones/i.test(it.item) ? "Notas libres" : "Novedad (opcional)"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard
        title={`Inventarios guardados (${guardados.length})`}
        subtitle="Aquí quedan todos los registros. Ábrelos para continuar o modificar."
      >
        {guardados.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay inventarios guardados.
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {guardados.map((g) => {
              const atencion = g.items.filter((i) => i.requiereAtencion).length;
              return (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {g.loft === 4 ? "Loft 4 (bodega)" : `Loft ${g.loft}`}
                      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {g.fecha} · {g.persona}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {atencion > 0
                        ? `${atencion} ítem(s) requieren atención`
                        : "Sin novedades destacadas"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCargar(g)}
                      className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(g.id)}
                      className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-500/10 dark:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </AdminShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";
const smallSelect =
  "w-full min-w-[130px] rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";
const smallInput =
  "w-full min-w-[180px] rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";

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
  color?: "green" | "amber" | "red";
}) {
  const palette: Record<string, string> = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    red: "bg-red-500/10 text-red-700 dark:text-red-300",
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
