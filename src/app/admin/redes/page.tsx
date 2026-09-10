"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { InstagramFeedPost } from "@/lib/instagram/types";

type Payload = {
  posts: InstagramFeedPost[];
  source?: string;
  syncedAt?: string | null;
  updated_at?: string;
  graphConfigured?: boolean;
  count?: number;
  note?: string;
};

function emptyPost(): InstagramFeedPost {
  return {
    id: `post-${Date.now()}`,
    url: "https://www.instagram.com/lofthouse.14/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-01.webp",
    isVideo: false,
    caption: "",
    publishedAt: new Date().toISOString(),
  };
}

export default function AdminRedesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    source?: string;
    syncedAt?: string | null;
    updated_at?: string;
    graphConfigured?: boolean;
  }>({});
  const [posts, setPosts] = useState<InstagramFeedPost[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/instagram-feed", {
        credentials: "include",
      });
      if (!res.ok) {
        setErr("No se pudo cargar el muro de Instagram.");
        return;
      }
      const json = (await res.json()) as Payload;
      setPosts(json.posts ?? []);
      setNote(json.note ?? null);
      setMeta({
        source: json.source,
        syncedAt: json.syncedAt,
        updated_at: json.updated_at,
        graphConfigured: json.graphConfigured,
      });
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
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/instagram-feed", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      const json = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) {
        setErr(json.error || "No se pudo guardar.");
        return;
      }
      setMsg(`Guardado · ${json.count ?? posts.length} publicaciones`);
      await load();
    } catch {
      setErr("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function syncGraph() {
    setSyncing(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/instagram-feed", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        count?: number;
      };
      if (!res.ok || !json.ok) {
        setErr(json.error || "Sync falló.");
        return;
      }
      setMsg(`Sincronizado desde Instagram · ${json.count} publicaciones`);
      await load();
    } catch {
      setErr("Error de red al sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  function updatePost(index: number, patch: Partial<InstagramFeedPost>) {
    setPosts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  }

  function removePost(index: number) {
    setPosts((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Redes / Instagram"
        subtitle="Muro público de publicaciones. Con token Meta se sincronizan todas; sin token edita el listado a mano."
      />

      {note ? (
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{note}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Guardando…" : "Guardar muro"}
        </button>
        <button
          type="button"
          onClick={() => void syncGraph()}
          disabled={syncing || loading || !meta.graphConfigured}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-600"
          title={
            meta.graphConfigured
              ? "Traer todas las publicaciones vía Graph API"
              : "Configura INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID"
          }
        >
          {syncing ? "Sincronizando…" : "Sincronizar Instagram"}
        </button>
        <button
          type="button"
          onClick={() => setPosts((p) => [emptyPost(), ...p])}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        >
          Añadir publicación
        </button>
        <span className="text-xs text-zinc-500">
          {posts.length} posts · origen {meta.source ?? "—"}
          {meta.syncedAt
            ? ` · sync ${new Date(meta.syncedAt).toLocaleString("es-CO")}`
            : null}
        </span>
      </div>

      {err ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{err}</p>
      ) : null}
      {msg ? (
        <p className="mb-3 text-sm text-emerald-700 dark:text-emerald-400">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <AdminCard key={`${post.id}-${index}`}>
              <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.thumbnailUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover bg-zinc-100"
                />
                <div className="grid gap-2 text-sm">
                  <label className="grid gap-1">
                    <span className="text-xs text-zinc-500">ID</span>
                    <input
                      className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
                      value={post.id}
                      onChange={(e) =>
                        updatePost(index, { id: e.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-zinc-500">URL Instagram</span>
                    <input
                      className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
                      value={post.url}
                      onChange={(e) =>
                        updatePost(index, { url: e.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-zinc-500">Thumbnail</span>
                    <input
                      className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
                      value={post.thumbnailUrl}
                      onChange={(e) =>
                        updatePost(index, { thumbnailUrl: e.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs text-zinc-500">Caption</span>
                    <textarea
                      rows={2}
                      className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-900"
                      value={post.caption}
                      onChange={(e) =>
                        updatePost(index, { caption: e.target.value })
                      }
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={post.isVideo}
                        onChange={(e) =>
                          updatePost(index, { isVideo: e.target.checked })
                        }
                      />
                      Video / Reel
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Fecha</span>
                      <input
                        type="datetime-local"
                        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                        value={
                          post.publishedAt
                            ? post.publishedAt.slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          updatePost(index, {
                            publishedAt: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removePost(index)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
