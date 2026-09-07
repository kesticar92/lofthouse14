"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { buildSeedCatalog } from "@/lib/catalog/seed";
import { ROOM_STATUSES, type RoomStatus } from "@/lib/catalog/schema";
import { cn } from "@/lib/cn";

type OrgProperty = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  timezone?: string;
  status?: string;
};

type RoomType = {
  id: string;
  code: string;
  name: string;
  marketing_category: string;
  short_label: string;
  tagline: string;
  max_guests: number;
  sort_order: number;
};

type Room = {
  id: string;
  code: string;
  unit_number: number | null;
  name: string;
  room_type_id: string | null;
  max_guests: number;
  status: string;
  legacy_property_id: string | null;
};

type CatalogPayload = {
  organization_id?: string;
  organization?: { id: string; slug: string; name: string } | null;
  properties: OrgProperty[];
  room_types: RoomType[];
  rooms: Room[];
  source?: string;
  read_only?: boolean;
  note?: string;
};

export default function AdminCatalogoPage() {
  const [data, setData] = useState<CatalogPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/catalog", { credentials: "include" });
      if (!res.ok) {
        const seed = buildSeedCatalog();
        setData({
          ...seed,
          read_only: true,
          note: "No se pudo cargar el catálogo remoto — mostrando seed LOFTHOUSE.",
        });
        return;
      }
      const json = (await res.json()) as CatalogPayload;
      setData(json);
    } catch {
      const seed = buildSeedCatalog();
      setData({
        ...seed,
        read_only: true,
        note: "Modo local — catálogo seed LOFTHOUSE (solo lectura).",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const typeById = useMemo(() => {
    const m = new Map<string, RoomType>();
    for (const t of data?.room_types ?? []) m.set(t.id, t);
    return m;
  }, [data?.room_types]);

  async function patchRoomType(
    id: string,
    fields: Partial<
      Pick<RoomType, "name" | "short_label" | "tagline" | "max_guests">
    >,
  ) {
    setBusyId(id);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_type: { id, ...fields } }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body &&
          typeof body === "object" &&
          "error" in body &&
          body.error &&
          typeof body.error === "object" &&
          "message" in body.error
            ? String((body.error as { message: string }).message)
            : "Error al guardar room type";
        setErr(message);
        return;
      }
      setMsg("Tipo de loft actualizado.");
      await load();
    } catch {
      setErr("Error de red");
    } finally {
      setBusyId(null);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  async function patchRoom(
    id: string,
    fields: Partial<{
      name: string;
      room_type_id: string | null;
      max_guests: number;
      status: RoomStatus;
    }>,
  ) {
    setBusyId(id);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: { id, ...fields } }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body &&
          typeof body === "object" &&
          "error" in body &&
          body.error &&
          typeof body.error === "object" &&
          "message" in body.error
            ? String((body.error as { message: string }).message)
            : "Error al guardar room";
        setErr(message);
        return;
      }
      setMsg("Unidad actualizada.");
      await load();
    } catch {
      setErr("Error de red");
    } finally {
      setBusyId(null);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  const locked = data?.read_only === true;

  return (
    <AdminShell>
      <div>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          CATÁLOGO
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Property (edificio), room types Vista / Atrio / Cielo y rooms LOFT
          01–14. Alineado con el website y el bridge PMS.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Cargando…</p>
      ) : null}

      {data?.note ? (
        <p className="rounded-xl border border-amber-900/20 bg-amber-900/5 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-100">
          {data.note}
        </p>
      ) : null}

      {msg ? (
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          {msg}
        </p>
      ) : null}
      {err ? (
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          {err}
        </p>
      ) : null}

      {data ? (
        <>
          <AdminCard
            title="Organización / Property"
            subtitle={
              data.organization
                ? `${data.organization.name} · ${data.organization.slug}`
                : (data.organization_id ?? "—")
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(data.properties ?? []).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-zinc-950/40"
                >
                  <p className="text-lg font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                    {p.slug}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {[p.address, p.city].filter(Boolean).join(" · ") ||
                      "Sin dirección"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {p.timezone ?? "America/Bogota"} · {p.status ?? "active"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Fuente: {data.source ?? "—"}
              {locked ? " · solo lectura" : ""}
            </p>
          </AdminCard>

          <AdminCard
            title="Room types"
            subtitle="Categorías comerciales Vista / Atrio / Cielo (marketing_category)."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {(data.room_types ?? []).map((rt) => (
                <RoomTypeEditor
                  key={rt.id}
                  rt={rt}
                  disabled={locked || busyId === rt.id}
                  onSave={(fields) => void patchRoomType(rt.id, fields)}
                />
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Rooms (LOFT 01–14)"
            subtitle="Unidades físicas. Bridge PMS vía legacy_property_id / properties.room_id."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs uppercase tracking-wider text-zinc-500 dark:border-white/10">
                    <th className="px-2 py-2 font-semibold">Código</th>
                    <th className="px-2 py-2 font-semibold">Nombre</th>
                    <th className="px-2 py-2 font-semibold">Tipo</th>
                    <th className="px-2 py-2 font-semibold">Huéspedes</th>
                    <th className="px-2 py-2 font-semibold">Estado</th>
                    <th className="px-2 py-2 font-semibold">PMS</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.rooms ?? []).map((room) => (
                    <tr
                      key={room.id}
                      className="border-b border-black/5 dark:border-white/5"
                    >
                      <td className="px-2 py-2 font-mono text-xs">
                        {room.code}
                      </td>
                      <td className="px-2 py-2">
                        {locked ? (
                          room.name
                        ) : (
                          <input
                            defaultValue={room.name}
                            disabled={busyId === room.id}
                            className="w-full min-w-[120px] rounded-lg border border-black/10 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900"
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next && next !== room.name) {
                                void patchRoom(room.id, { name: next });
                              }
                            }}
                          />
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {locked ? (
                          typeById.get(room.room_type_id ?? "")?.short_label ??
                          "—"
                        ) : (
                          <select
                            value={room.room_type_id ?? ""}
                            disabled={
                              busyId === room.id || room.status === "storage"
                            }
                            className="rounded-lg border border-black/10 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900"
                            onChange={(e) => {
                              const v = e.target.value || null;
                              void patchRoom(room.id, { room_type_id: v });
                            }}
                          >
                            <option value="">—</option>
                            {(data.room_types ?? []).map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.short_label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {locked ? (
                          room.max_guests
                        ) : (
                          <input
                            type="number"
                            min={1}
                            max={20}
                            defaultValue={room.max_guests}
                            disabled={busyId === room.id}
                            className="w-16 rounded-lg border border-black/10 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900"
                            onBlur={(e) => {
                              const n = Number(e.target.value);
                              if (
                                Number.isFinite(n) &&
                                n >= 1 &&
                                n !== room.max_guests
                              ) {
                                void patchRoom(room.id, { max_guests: n });
                              }
                            }}
                          />
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {locked ? (
                          <StatusPill status={room.status} />
                        ) : (
                          <select
                            value={room.status}
                            disabled={busyId === room.id}
                            className="rounded-lg border border-black/10 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900"
                            onChange={(e) => {
                              void patchRoom(room.id, {
                                status: e.target.value as RoomStatus,
                              });
                            }}
                          >
                            {ROOM_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-2 py-2 font-mono text-[10px] text-zinc-500">
                        {room.legacy_property_id
                          ? `${room.legacy_property_id.slice(0, 8)}…`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </>
      ) : null}
    </AdminShell>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        status === "active" &&
          "bg-emerald-900/10 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-300",
        status === "storage" &&
          "bg-zinc-900/10 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
        status === "maintenance" &&
          "bg-amber-900/10 text-amber-900 dark:bg-amber-400/10 dark:text-amber-300",
        status === "inactive" &&
          "bg-red-900/10 text-red-800 dark:bg-red-400/10 dark:text-red-300",
      )}
    >
      {status}
    </span>
  );
}

function RoomTypeEditor({
  rt,
  disabled,
  onSave,
}: {
  rt: RoomType;
  disabled: boolean;
  onSave: (
    fields: Partial<
      Pick<RoomType, "name" | "short_label" | "tagline" | "max_guests">
    >,
  ) => void;
}) {
  const [name, setName] = useState(rt.name);
  const [shortLabel, setShortLabel] = useState(rt.short_label);
  const [tagline, setTagline] = useState(rt.tagline);
  const [maxGuests, setMaxGuests] = useState(String(rt.max_guests));

  useEffect(() => {
    setName(rt.name);
    setShortLabel(rt.short_label);
    setTagline(rt.tagline);
    setMaxGuests(String(rt.max_guests));
  }, [rt]);

  const dirty =
    name !== rt.name ||
    shortLabel !== rt.short_label ||
    tagline !== rt.tagline ||
    Number(maxGuests) !== rt.max_guests;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-zinc-950/40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900 dark:text-amber-400">
        {rt.marketing_category}
      </p>
      <label className="text-xs text-zinc-500">
        Nombre
        <input
          value={name}
          disabled={disabled}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm font-semibold dark:border-white/10 dark:bg-zinc-900"
        />
      </label>
      <label className="text-xs text-zinc-500">
        Etiqueta corta
        <input
          value={shortLabel}
          disabled={disabled}
          onChange={(e) => setShortLabel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-900"
        />
      </label>
      <label className="text-xs text-zinc-500">
        Tagline
        <input
          value={tagline}
          disabled={disabled}
          onChange={(e) => setTagline(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-900"
        />
      </label>
      <label className="text-xs text-zinc-500">
        Máx. huéspedes
        <input
          type="number"
          min={1}
          max={20}
          value={maxGuests}
          disabled={disabled}
          onChange={(e) => setMaxGuests(e.target.value)}
          className="mt-1 w-24 rounded-lg border border-black/10 bg-white/80 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-zinc-900"
        />
      </label>
      {!disabled ? (
        <button
          type="button"
          disabled={!dirty || disabled}
          onClick={() =>
            onSave({
              name: name.trim(),
              short_label: shortLabel.trim(),
              tagline: tagline.trim(),
              max_guests: Number(maxGuests) || rt.max_guests,
            })
          }
          className="mt-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-40 dark:bg-[#f2f0eb] dark:text-zinc-900"
        >
          Guardar
        </button>
      ) : null}
    </div>
  );
}
