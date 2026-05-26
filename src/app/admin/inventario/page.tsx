"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import {
  TODOS_LOS_LOFTS,
  type EstadoItem,
  type Funciona,
} from "@/lib/inventory-catalog";
import { compressImage } from "@/lib/compress-image";
import { PrintableInventory } from "@/components/admin/printable-inventory";
import { generarFolio } from "@/components/admin/printable-quote";
import { MigrateLocalInventariosBanner } from "@/features/inventarios/migrate-banner";
import {
  useInventarios,
  useInventario,
  useCreateInventario,
  useUpdateInventario,
  useDeleteInventario,
  useUploadFoto,
  useDeleteFoto,
} from "@/features/inventarios/hooks";
import type { InventarioRevisionSummary } from "@/features/inventarios/types";
import type { InventarioRevisionCreateInput } from "@/features/inventarios/schemas";
import { ApiClientError } from "@/lib/api/client";
import { useConfirm, useToast } from "@/components/ui";
import { Field, StatChip } from "@/features/aseos/components/atoms";
import {
  ItemCardMobile,
  ItemRowDesktop,
  inputClass,
} from "@/features/inventarios/components/item-editor";
import {
  buildEmpty,
  itemRequiereEvidenciaDanio,
  todayISO,
  type EditableItem,
} from "@/features/inventarios/utils";
import { useRequireAdminModule } from "@/hooks/useRequireAdminModule";

export default function InventarioPage() {
  const { ready } = useRequireAdminModule();
  const toast = useToast();
  const confirm = useConfirm();
  const [loft, setLoft] = useState<number>(1);
  const [persona, setPersona] = useState("");
  const [fecha, setFecha] = useState<string>("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [filtroZona, setFiltroZona] = useState<string>("Todas");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [printFolio, setPrintFolio] = useState<string>("");
  const [printEmision, setPrintEmision] = useState<string>("");

  const inventariosQuery = useInventarios();
  const guardados = inventariosQuery.data ?? [];

  const detalleQuery = useInventario(editId);

  const createMut = useCreateInventario();
  const updateMut = useUpdateInventario();
  const deleteMut = useDeleteInventario();
  const uploadFotoMut = useUploadFoto();
  const deleteFotoMut = useDeleteFoto();

  // Inicialización: fecha de hoy + checklist vacío para loft 1.
  useEffect(() => {
    setFecha(todayISO());
    setItems(buildEmpty(1));
  }, []);

  // Cuando se carga una revisión desde el servidor (editId), aplanamos sus
  // items en `items` manteniendo el orden del catálogo cuando coincide.
  useEffect(() => {
    if (!detalleQuery.data) return;
    const rev = detalleQuery.data;
    const loftNum = Number(rev.loft_id) || 1;
    setLoft(loftNum);
    setPersona(rev.persona);
    setFecha(rev.fecha);

    // Reconstruimos items partiendo del catálogo, mezclando con datos del server
    const baseItems = buildEmpty(loftNum);
    const byKey = new Map<string, (typeof rev.items)[number]>();
    for (const it of rev.items) {
      byKey.set(`${it.zona}|${it.item}`, it);
    }

    const merged: EditableItem[] = baseItems.map((base) => {
      const key = `${base.zona}|${base.item}`;
      const fromServer = byKey.get(key);
      if (!fromServer) return base;
      byKey.delete(key);
      return {
        serverId: fromServer.id,
        orden: base.orden,
        zona: base.zona,
        item: base.item,
        estado: (fromServer.estado as EstadoItem) ?? "",
        funciona: (fromServer.funciona as Funciona) ?? "",
        detalles: fromServer.detalles,
        requiereAtencion: fromServer.requiere_atencion,
        fotos: fromServer.fotos,
      };
    });

    // Items en el server que NO estaban en el catálogo (por si el catálogo cambió)
    for (const extra of byKey.values()) {
      merged.push({
        serverId: extra.id,
        orden: extra.orden,
        zona: extra.zona,
        item: extra.item,
        estado: (extra.estado as EstadoItem) ?? "",
        funciona: (extra.funciona as Funciona) ?? "",
        detalles: extra.detalles,
        requiereAtencion: extra.requiere_atencion,
        fotos: extra.fotos,
      });
    }
    setItems(merged);
  }, [detalleQuery.data]);

  function cambiarLoft(l: number) {
    setLoft(l);
    setEditId(null);
    setItems(buildEmpty(l));
    setFiltroZona("Todas");
  }

  function setItem(idx: number, patch: Partial<EditableItem>) {
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

  function buildPayload(): InventarioRevisionCreateInput {
    return {
      loft_id: String(loft),
      persona: persona.trim() || "—",
      fecha,
      items: items.map((it) => ({
        orden: it.orden,
        zona: it.zona,
        item: it.item,
        estado: it.estado === "" ? "OK" : it.estado,
        funciona: it.funciona === "" ? "Sí" : it.funciona,
        detalles: it.detalles,
        requiere_atencion: it.requiereAtencion,
      })),
    };
  }

  async function handleGuardar() {
    try {
      if (editId) {
        await updateMut.mutateAsync({ id: editId, patch: buildPayload() });
        toast.success("Inventario actualizado.");
      } else {
        const created = await createMut.mutateAsync(buildPayload());
        setEditId(created.id);
        toast.success("Inventario guardado.", {
          description:
            "Puedes añadir fotos en ítems marcados como Dañado o que No funcionan.",
        });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error al guardar";
      toast.error("No se pudo guardar el inventario", { description: m });
    }
  }

  async function handleCargar(g: InventarioRevisionSummary) {
    setEditId(g.id);
    setFiltroZona("Todas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEliminar(id: string) {
    const ok = await confirm({
      title: "¿Eliminar este registro de inventario?",
      description:
        "Se eliminan también las fotos asociadas en Supabase Storage. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteMut.mutateAsync(id);
      if (editId === id) {
        setEditId(null);
        setItems(buildEmpty(loft));
      }
      toast.success("Inventario eliminado.");
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error al eliminar";
      toast.error("No se pudo eliminar el inventario", { description: m });
    }
  }

  function handleNuevo() {
    setEditId(null);
    setItems(buildEmpty(loft));
    setPersona("");
    setFecha(todayISO());
  }

  async function handleAddFoto(idx: number, file: File) {
    const it = items[idx];
    if (!itemRequiereEvidenciaDanio(it)) {
      toast.warning(
        "Las fotos solo aplican a ítems dañados o que no funcionan.",
        {
          description:
            "Marca «Dañado» o «No» en ¿Funciona? antes de subir evidencia.",
        },
      );
      return;
    }
    if (!editId || !it.serverId) {
      toast.warning("Guarda el inventario antes de subir fotos.", {
        description:
          "Las fotos se cargan en tiempo real a Supabase Storage y necesitan el ID del ítem.",
      });
      return;
    }
    setUploadingIdx(idx);
    try {
      const { dataUrl, bytes } = await compressImage(file, {
        maxDimension: 1280,
        quality: 0.7,
      });
      // Convertir el dataUrl comprimido en un Blob real para upload
      const blob = await (await fetch(dataUrl)).blob();
      const compressedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, "") + ".jpg",
        { type: "image/jpeg" },
      );
      const uploaded = await uploadFotoMut.mutateAsync({
        revisionId: editId,
        itemId: it.serverId,
        file: compressedFile,
      });
      void bytes; // tamaño calculado por la compresión; el server guarda el real
      setItems((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          fotos: [...next[idx].fotos, uploaded],
        };
        return next;
      });
    } catch (e) {
      let m = e instanceof Error ? e.message : "Error al subir";
      if (
        e instanceof ApiClientError &&
        (e.code === "NETWORK_ERROR" || /failed to fetch/i.test(m))
      ) {
        m =
          "Sin respuesta del servidor. Si trabajas en local con http://localhost, reinicia `npm run dev` tras actualizar la configuración; comprueba también que no bloquee el firewall.";
      }
      toast.error("No se pudo subir la foto", { description: m });
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleRemoveFoto(idx: number, fotoId: string) {
    const it = items[idx];
    if (!editId || !it.serverId) return;
    try {
      await deleteFotoMut.mutateAsync({
        revisionId: editId,
        itemId: it.serverId,
        fotoId,
      });
      setItems((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          fotos: next[idx].fotos.filter((f) => f.id !== fotoId),
        };
        return next;
      });
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error al eliminar";
      toast.error("No se pudo eliminar la foto", { description: m });
    }
  }

  function handleGenerarPDF() {
    if (items.length === 0) return;
    const now = new Date();
    setPrintFolio(generarFolio(now));
    setPrintEmision(now.toISOString());
    requestAnimationFrame(() => {
      window.print();
    });
  }

  if (!ready) {
    return (
      <AdminShell>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Cargando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          INVENTARIO POR LOFT
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Revisa artículo por artículo cada loft. Marca estado y si funciona;
          los ítems que no apliquen se llenan solos. Las fotos quedan
          respaldadas en Supabase Storage. Las fotos son solo evidencia de daño
          o fallo de funcionamiento.
        </p>
      </div>

      <MigrateLocalInventariosBanner />

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
              disabled={createMut.isPending || updateMut.isPending}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#f2f0eb] dark:text-zinc-900"
            >
              {createMut.isPending || updateMut.isPending
                ? "Guardando…"
                : editId
                  ? "Actualizar inventario"
                  : "Guardar inventario"}
            </button>
            <button
              type="button"
              onClick={handleGenerarPDF}
              className="rounded-full border border-amber-700/40 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-900 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
            >
              Generar PDF
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
          <StatChip
            label="Marcados"
            value={`${totales.marcados} / ${items.length}`}
          />
          <StatChip label="Presentes" value={totales.presente} color="green" />
          <StatChip label="Ausentes" value={totales.ausente} color="amber" />
          <StatChip label="Dañados" value={totales.danado} color="red" />
          <StatChip label="No aplica" value={totales.noAplica} />
          <StatChip label="Atención" value={totales.atencion} color="red" />
        </div>
      </AdminCard>

      <AdminCard
        title={`Checklist — Loft ${loft}${loft === 4 ? " (bodega)" : ""}`}
      >
        {/* Escritorio: tabla */}
        <div className="hidden overflow-x-auto md:block">
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
                  <ItemRowDesktop
                    key={idx}
                    idx={idx}
                    it={it}
                    canUploadFotos={Boolean(editId && it.serverId)}
                    uploading={uploadingIdx === idx}
                    onChange={(patch) => setItem(idx, patch)}
                    onAddFoto={(file) => handleAddFoto(idx, file)}
                    onRemoveFoto={(fotoId) => handleRemoveFoto(idx, fotoId)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Móvil: tarjetas apiladas, controles a ancho completo */}
        <ul className="md:hidden space-y-4">
          {visibleIndices.map((idx) => {
            const it = items[idx];
            return (
              <li key={idx}>
                <ItemCardMobile
                  idx={idx}
                  it={it}
                  canUploadFotos={Boolean(editId && it.serverId)}
                  uploading={uploadingIdx === idx}
                  onChange={(patch) => setItem(idx, patch)}
                  onAddFoto={(file) => handleAddFoto(idx, file)}
                  onRemoveFoto={(fotoId) => handleRemoveFoto(idx, fotoId)}
                />
              </li>
            );
          })}
        </ul>
      </AdminCard>

      <AdminCard
        title={`Inventarios guardados (${guardados.length})`}
        subtitle="Aquí quedan todos los registros sincronizados desde la base de datos."
      >
        {inventariosQuery.isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando…</p>
        ) : guardados.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay inventarios guardados.
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {guardados.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {Number(g.loft_id) === 4
                      ? "Loft 4 (bodega)"
                      : `Loft ${g.loft_id}`}
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {g.fecha} · {g.persona}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {g.con_atencion > 0
                      ? `${g.con_atencion} ítem(s) requieren atención`
                      : "Sin novedades destacadas"}
                    {" · "}
                    {g.fotos_count} foto(s)
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
            ))}
          </ul>
        )}
      </AdminCard>

      {/* Reporte imprimible (PDF). Oculto en pantalla, visible al imprimir. */}
      {printFolio && items.length > 0 && (
        <PrintableInventory
          folio={printFolio}
          emisionISO={printEmision}
          loft={loft}
          persona={persona.trim() || "—"}
          fecha={fecha}
          items={items.map((it) => ({
            orden: it.orden,
            zona: it.zona,
            item: it.item,
            estado: (it.estado || "") as EstadoItem,
            funciona: (it.funciona || "") as Funciona,
            detalles: it.detalles,
            requiereAtencion: it.requiereAtencion,
            fotos: it.fotos.map((f) => ({
              id: f.id,
              dataUrl: f.url ?? "",
              caption: f.caption,
              creadaEn: f.created_at,
              bytes: f.file_size,
            })),
          }))}
        />
      )}
    </AdminShell>
  );
}
