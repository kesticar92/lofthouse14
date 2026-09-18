"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { LoftCategoryId } from "@/data/loft-categories";

type CatEdit = {
  images: string[];
  amenities: string[];
};

type Payload = {
  defaults: Record<LoftCategoryId, CatEdit>;
  overrides: Partial<Record<LoftCategoryId, Partial<CatEdit>>>;
  updated_at?: string;
  note?: string;
};

const LABELS: Record<LoftCategoryId, string> = {
  vista: "Loft Vista",
  atrio: "Loft Atrio",
  cielo: "Loft Cielo",
};

const IDS: LoftCategoryId[] = ["vista", "atrio", "cielo"];

function mergeEdit(
  id: LoftCategoryId,
  defaults: Payload["defaults"],
  overrides: Payload["overrides"],
): CatEdit {
  const d = defaults[id];
  const o = overrides[id];
  return {
    images:
      o?.images && o.images.length > 0 ? [...o.images] : [...(d?.images ?? [])],
    amenities:
      o?.amenities && o.amenities.length > 0
        ? [...o.amenities]
        : [...(d?.amenities ?? [])],
  };
}

export default function AdminLoftsMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<LoftCategoryId, CatEdit> | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/lofts-marketing", {
        credentials: "include",
      });
      if (!res.ok) {
        setErr("No se pudo cargar el marketing de lofts.");
        return;
      }
      const json = (await res.json()) as Payload;
      setNote(json.note ?? null);
      setUpdatedAt(json.updated_at ?? null);
      const next = {} as Record<LoftCategoryId, CatEdit>;
      for (const id of IDS) {
        next[id] = mergeEdit(id, json.defaults, json.overrides ?? {});
      }
      setEdits(next);
    } catch {
      setErr("Error de red al cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!edits) return;
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/lofts-marketing", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: edits }),
      });
      if (!res.ok) {
        setErr("No se pudo guardar.");
        return;
      }
      const json = (await res.json()) as { updated_at?: string };
      setUpdatedAt(json.updated_at ?? null);
      setMsg("Guardado en `.data/lofts-marketing.json`.");
    } catch {
      setErr("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  }

  function patchCat(id: LoftCategoryId, patch: Partial<CatEdit>) {
    setEdits((prev) => {
      if (!prev) return prev;
      return { ...prev, [id]: { ...prev[id], ...patch } };
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Lofts web"
        subtitle="Fotos del carrusel y amenities de Vista / Atrio / Cielo en el hero."
      />

      {note ? (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{note}</p>
      ) : null}
      {updatedAt && updatedAt !== new Date(0).toISOString() ? (
        <p className="mb-4 text-xs text-zinc-400">
          Última edición: {new Date(updatedAt).toLocaleString("es-CO")}
        </p>
      ) : null}
      {err ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">
          {msg}
        </p>
      ) : null}

      {loading || !edits ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="space-y-6">
          {IDS.map((id) => {
            const edit = edits[id];
            return (
              <AdminCard key={id} title={LABELS[id]}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Fotos (paths o URLs)
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {edit.images.map((src) => (
                        <div
                          key={src}
                          className="relative h-16 w-24 overflow-hidden rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {edit.images.map((src, i) => (
                      <div key={`${id}-img-${i}`} className="mb-2 flex gap-2">
                        <input
                          value={src}
                          onChange={(e) => {
                            const images = [...edit.images];
                            images[i] = e.target.value;
                            patchCat(id, { images });
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            patchCat(id, {
                              images: edit.images.filter((_, j) => j !== i),
                            })
                          }
                          className="rounded-lg border border-zinc-300 px-3 text-xs font-semibold dark:border-zinc-600"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        patchCat(id, {
                          images: [...edit.images, "/gallery/"],
                        })
                      }
                      className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-400"
                    >
                      + Añadir foto
                    </button>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Amenities
                    </p>
                    {edit.amenities.map((a, i) => (
                      <div key={`${id}-am-${i}`} className="mb-2 flex gap-2">
                        <input
                          value={a}
                          onChange={(e) => {
                            const amenities = [...edit.amenities];
                            amenities[i] = e.target.value;
                            patchCat(id, { amenities });
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            patchCat(id, {
                              amenities: edit.amenities.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                          className="rounded-lg border border-zinc-300 px-3 text-xs font-semibold dark:border-zinc-600"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        patchCat(id, {
                          amenities: [...edit.amenities, ""],
                        })
                      }
                      className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-400"
                    >
                      + Añadir amenity
                    </button>
                  </div>
                </div>
              </AdminCard>
            );
          })}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-semibold dark:border-zinc-600"
            >
              Recargar
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-semibold dark:border-zinc-600"
            >
              Ver sitio
            </Link>
          </div>

          <p className="text-xs text-zinc-500">
            Persistencia: archivo local{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              .data/lofts-marketing.json
            </code>
            . Documentación:{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              docs/LOFTS-MARKETING.md
            </code>
            .
          </p>
        </div>
      )}
    </AdminShell>
  );
}
