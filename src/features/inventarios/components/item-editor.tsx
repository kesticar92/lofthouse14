"use client";

import { formatBytes } from "@/lib/compress-image";
import type { EstadoItem, Funciona } from "@/lib/inventory-catalog";
import {
  ESTADOS,
  FUNCIONA_OPCIONES,
  itemRequiereEvidenciaDanio,
  type EditableItem,
} from "@/features/inventarios/utils";

export const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";

const smallSelect =
  "w-full min-w-[130px] rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";
const smallInput =
  "w-full min-w-[180px] rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";
const mobileSelect =
  "box-border w-full max-w-full rounded-xl border border-black/10 bg-white/90 px-3 py-3 text-base outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/80";
const mobileInput =
  "box-border w-full max-w-full rounded-xl border border-black/10 bg-white/90 px-3 py-3 text-base outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/80";

export type ItemEditorProps = {
  idx: number;
  it: EditableItem;
  canUploadFotos: boolean;
  uploading: boolean;
  onChange: (patch: Partial<EditableItem>) => void;
  onAddFoto: (file: File) => void;
  onRemoveFoto: (fotoId: string) => void;
};

function EvidenciaFotosPanel({
  idx,
  it,
  canUploadFotos,
  uploading,
  onAddFoto,
  onRemoveFoto,
}: Pick<
  ItemEditorProps,
  "idx" | "it" | "canUploadFotos" | "uploading" | "onAddFoto" | "onRemoveFoto"
>) {
  const camId = `inv-foto-cam-${idx}`;
  const galId = `inv-foto-gal-${idx}`;
  return (
    <div className="rounded-lg border border-red-300/50 bg-white/80 p-3 dark:border-red-500/20 dark:bg-zinc-900/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700 dark:text-red-300">
          Evidencia fotográfica del daño o fallo
        </p>
        {canUploadFotos ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              disabled={uploading}
              onClick={() => document.getElementById(camId)?.click()}
              className={`min-h-[44px] flex-1 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition sm:min-h-0 sm:flex-none ${
                uploading
                  ? "border-zinc-300 bg-zinc-100 text-zinc-500"
                  : "border-zinc-800/25 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-white/20 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              }`}
            >
              {uploading ? "Subiendo…" : "Cámara"}
            </button>
            <label
              htmlFor={galId}
              className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider transition sm:min-h-0 sm:flex-none ${
                uploading
                  ? "border-zinc-300 bg-zinc-100 text-zinc-500"
                  : "border-amber-700/40 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300"
              }`}
            >
              Galería
            </label>
            <input
              id={camId}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAddFoto(file);
                e.currentTarget.value = "";
              }}
            />
            <input
              id={galId}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAddFoto(file);
                e.currentTarget.value = "";
              }}
            />
          </div>
        ) : (
          <span className="rounded-full border border-amber-700/30 bg-amber-50/50 px-3 py-1.5 text-[11px] text-amber-900/80 dark:border-amber-400/30 dark:bg-amber-400/5 dark:text-amber-300/80">
            Guarda el inventario para añadir fotos
          </span>
        )}
      </div>

      {it.fotos.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Solo evidencia de ítems dañados o que no funcionan. Las imágenes se
          guardan en Supabase Storage y aparecen en el PDF.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {it.fotos.map((f, fi) => (
            <li
              key={f.id}
              className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
            >
              {f.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.url}
                  alt={`Evidencia ${fi + 1}`}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800">
                  (foto)
                </div>
              )}
              <div className="space-y-2 p-2">
                {f.caption ? (
                  <p className="line-clamp-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                    {f.caption}
                  </p>
                ) : null}
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{f.file_size ? formatBytes(f.file_size) : ""}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveFoto(f.id)}
                    className="font-semibold uppercase tracking-wider text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ItemRowDesktop({
  idx,
  it,
  canUploadFotos,
  uploading,
  onChange,
  onAddFoto,
  onRemoveFoto,
}: ItemEditorProps) {
  const showFotos = itemRequiereEvidenciaDanio(it);
  return (
    <>
      <tr
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
              onChange({ estado: e.target.value as EstadoItem | "" })
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
              onChange({ funciona: e.target.value as Funciona | "" })
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
            onChange={(e) => onChange({ detalles: e.target.value })}
            placeholder={
              /observaciones/i.test(it.item)
                ? "Notas libres"
                : "Novedad (opcional)"
            }
          />
        </td>
      </tr>
      {showFotos && (
        <tr className="bg-red-500/5">
          <td colSpan={6} className="px-2 pb-3">
            <EvidenciaFotosPanel
              idx={idx}
              it={it}
              canUploadFotos={canUploadFotos}
              uploading={uploading}
              onAddFoto={onAddFoto}
              onRemoveFoto={onRemoveFoto}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function ItemCardMobile({
  idx,
  it,
  canUploadFotos,
  uploading,
  onChange,
  onAddFoto,
  onRemoveFoto,
}: ItemEditorProps) {
  const showFotos = itemRequiereEvidenciaDanio(it);
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 ${
        it.requiereAtencion
          ? "border-red-300/40 bg-red-500/[0.06]"
          : it.estado === "No aplica"
            ? "opacity-70"
            : "bg-white/60 dark:bg-zinc-900/40"
      }`}
    >
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-lg text-zinc-500 tabular-nums">
            {it.orden}.
          </span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] dark:bg-white/10">
            {it.zona}
          </span>
        </div>
        <p className="text-sm font-medium leading-snug">{it.item}</p>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Estado
          </span>
          <select
            className={mobileSelect}
            value={it.estado}
            onChange={(e) =>
              onChange({ estado: e.target.value as EstadoItem | "" })
            }
          >
            <option value="">—</option>
            {ESTADOS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            ¿Funciona?
          </span>
          <select
            className={mobileSelect}
            value={it.funciona}
            onChange={(e) =>
              onChange({ funciona: e.target.value as Funciona | "" })
            }
          >
            <option value="">—</option>
            {FUNCIONA_OPCIONES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Detalles
          </span>
          <input
            className={mobileInput}
            value={it.detalles}
            onChange={(e) => onChange({ detalles: e.target.value })}
            placeholder={
              /observaciones/i.test(it.item)
                ? "Notas libres"
                : "Novedad (opcional)"
            }
          />
        </label>
      </div>
      {showFotos ? (
        <div className="border-t border-red-300/30 bg-red-500/[0.04] p-4 dark:border-red-500/20">
          <EvidenciaFotosPanel
            idx={idx}
            it={it}
            canUploadFotos={canUploadFotos}
            uploading={uploading}
            onAddFoto={onAddFoto}
            onRemoveFoto={onRemoveFoto}
          />
        </div>
      ) : null}
    </article>
  );
}
