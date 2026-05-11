"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminShell,
  AdminCard,
} from "@/components/admin/admin-shell";
import { PmsCalendarHub } from "@/components/admin/pms/pms-calendar-hub";
import { ReservationsTimeline } from "@/components/admin/pms/reservations-timeline";
import { usePmsModule } from "@/hooks/usePms";
import { fetchAdminSession } from "@/lib/auth-client";
import { addDays, parseISODate, toISODateString } from "@/lib/pms/date-range";
import { cn } from "@/lib/cn";

function siteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://lofthouse14.com"
  );
}

export default function AdminReservasPage() {
  const pms = usePmsModule();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetchAdminSession().then((s) => {
      if (s && (s.role === "super_admin" || s.role === "admin")) {
        setIsSuperAdmin(true);
      }
    });
  }, []);

  const [showRes, setShowRes] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [blockDraft, setBlockDraft] = useState<{
    propertyId: string;
    start: string;
    endInclusive: string;
  } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const [resForm, setResForm] = useState({
    property_id: "",
    guest_name: "",
    guest_phone: "",
    check_in: "",
    check_out: "",
    guests: "2",
    price: "",
    notes: "",
    source: "direct",
    referrer_name: "",
    commission_amount: "",
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  useEffect(() => {
    if (pms.properties.length === 0) return;
    const exists = pms.properties.some((p) => p.id === selectedPropertyId);
    if (!selectedPropertyId || !exists) {
      setSelectedPropertyId(pms.properties[0].id);
    }
  }, [pms.properties, selectedPropertyId]);

  const exportUrl = useMemo(() => {
    const prop = pms.properties.find((p) => p.id === selectedPropertyId);
    if (!prop) return "";
    return `${siteOrigin()}/api/ical/${prop.id}?token=${encodeURIComponent(prop.ical_token)}`;
  }, [pms.properties, selectedPropertyId]);

  async function patchReservation(payload: {
    id: string;
    property_id: string;
    check_in: string;
    check_out: string;
  }): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/admin/pms/reservations/${payload.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: payload.property_id,
        check_in: payload.check_in,
        check_out: payload.check_out,
      }),
    });
    const text = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      return { ok: false, error: text || res.statusText };
    }
    if (!res.ok) {
      return { ok: false, error: data.error ?? res.statusText };
    }
    return { ok: true };
  }

  async function postJson<T>(
    url: string,
    body: unknown,
  ): Promise<{ ok: boolean; data?: T; error?: string }> {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: T | { error?: string } = {} as T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      return { ok: false, error: text || res.statusText };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: (data as { error?: string }).error ?? res.statusText,
      };
    }
    return { ok: true, data: data as T };
  }

  async function syncNow() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const r = await postJson<{ sources: number; results: unknown[] }>(
      "/api/admin/pms/sync",
      {},
    );
    setBusy(false);
    if (!r.ok) {
      setErr(r.error ?? "Error");
      return;
    }
    setMsg("Sincronización iCal completada.");
    await pms.refresh();
  }

  async function copyExport() {
    if (!exportUrl) return;
    try {
      await navigator.clipboard.writeText(exportUrl);
      setMsg("URL del calendario exportado copiada.");
    } catch {
      setErr("No se pudo copiar al portapapeles.");
    }
  }

  async function addImportUrl(
    url: string,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!selectedPropertyId) {
      return { ok: false, error: "Elige una propiedad." };
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const r = await postJson<{ sync?: { message?: string } }>(
      "/api/admin/pms/ical-sources",
      { property_id: selectedPropertyId, url, sync_now: true },
    );
    setBusy(false);
    if (!r.ok) {
      setErr(r.error ?? "Error al añadir el enlace.");
      return { ok: false, error: r.error };
    }
    setMsg(
      r.data?.sync?.message?.trim() ||
        "Enlace iCal añadido y sincronizado.",
    );
    await pms.refresh();
    return { ok: true };
  }

  async function syncOneSource(
    id: string,
  ): Promise<{ ok: boolean; error?: string }> {
    setErr(null);
    setMsg(null);
    const res = await fetch(`/api/admin/pms/ical-sources/${id}/sync`, {
      method: "POST",
      credentials: "include",
    });
    const text = await res.text();
    let j: { ok?: boolean; error?: string; message?: string } = {};
    try {
      j = JSON.parse(text) as { ok?: boolean; error?: string; message?: string };
    } catch {
      const er = text || res.statusText;
      setErr(er);
      return { ok: false, error: er };
    }
    if (!res.ok) {
      const er = j.error ?? j.message ?? res.statusText;
      setErr(er);
      return { ok: false, error: er };
    }
    if (j.ok === false) {
      const er = j.message ?? "Error al sincronizar";
      setErr(er);
      return { ok: false, error: er };
    }
    setMsg(j.message ?? "Fuente sincronizada.");
    await pms.refresh();
    return { ok: true };
  }

  async function deleteSource(
    id: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/admin/pms/ical-sources/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const t = await res.text();
      let j: { error?: string } = {};
      try {
        j = JSON.parse(t) as { error?: string };
      } catch {
        const er = t || res.statusText;
        setErr(er);
        return { ok: false, error: er };
      }
      const er = j.error ?? res.statusText;
      setErr(er);
      return { ok: false, error: er };
    }
    setMsg(
      "Enlace iCal eliminado. Las reservas importadas desde él también se borraron del calendario.",
    );
    await pms.refresh();
    return { ok: true };
  }

  async function regenerateToken() {
    const pid = selectedPropertyId;
    if (!pid) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/pms/properties", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pid, regenerate_ical_token: true }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? res.statusText);
      return;
    }
    setMsg("Token de exportación regenerado.");
    await pms.refresh();
  }

  async function addProperty(name: string): Promise<{ ok: boolean; error?: string }> {
    setBusy(true);
    setErr(null);
    const r = await postJson("/api/admin/pms/properties", { name });
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? "Error"); return { ok: false, error: r.error }; }
    setMsg(`Anuncio "${name}" creado.`);
    await pms.refresh();
    return { ok: true };
  }

  async function renameProperty(id: string, name: string): Promise<{ ok: boolean; error?: string }> {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/pms/properties", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = (j as { error?: string }).error ?? res.statusText;
      setErr(e);
      return { ok: false, error: e };
    }
    setMsg("Anuncio renombrado.");
    await pms.refresh();
    return { ok: true };
  }

  async function deleteProperty(id: string): Promise<{ ok: boolean; error?: string }> {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/admin/pms/properties?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = (j as { error?: string }).error ?? res.statusText;
      setErr(e);
      return { ok: false, error: e };
    }
    setMsg(
      "Anuncio eliminado. También se borraron sus reservas, enlaces iCal, bloqueos y tareas de aseo asociadas.",
    );
    await pms.refresh();
    return { ok: true };
  }

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    if (resForm.source === "referral" && !resForm.referrer_name.trim()) {
      setErr("Indica el nombre del referidor para contabilizar la comisión.");
      setBusy(false);
      return;
    }
    const commissionParsed =
      resForm.source === "referral" && resForm.commission_amount.trim() !== ""
        ? Number(resForm.commission_amount)
        : null;
    if (
      resForm.source === "referral" &&
      resForm.commission_amount.trim() !== "" &&
      (!Number.isFinite(commissionParsed) || (commissionParsed ?? 0) < 0)
    ) {
      setErr("El monto de comisión no es válido.");
      setBusy(false);
      return;
    }
    const r = await postJson("/api/admin/pms/reservations", {
      property_id: resForm.property_id || selectedPropertyId,
      guest_name: resForm.guest_name,
      guest_phone: resForm.guest_phone,
      check_in: resForm.check_in,
      check_out: resForm.check_out,
      guests: Number(resForm.guests) || 1,
      price: resForm.price ? Number(resForm.price) : null,
      notes: resForm.notes,
      source: resForm.source,
      status: "confirmed",
      referrer_name:
        resForm.source === "referral" ? resForm.referrer_name.trim() : "",
      commission_amount:
        resForm.source === "referral" ? commissionParsed : null,
    });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error ?? "Error");
      return;
    }
    setShowRes(false);
    setMsg("Reserva creada.");
    await pms.refresh();
  }

  async function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDraft) return;
    setBusy(true);
    setErr(null);
    const r = await postJson("/api/admin/pms/blocks", {
      property_id: blockDraft.propertyId,
      start_date: blockDraft.start,
      end_date: blockDraft.endInclusive,
      reason: blockReason,
    });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error ?? "Error");
      return;
    }
    setShowBlock(false);
    setBlockDraft(null);
    setBlockReason("");
    setMsg("Bloqueo creado.");
    await pms.refresh();
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reservas & ocupación
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
            Calendario tipo timeline para los{" "}
            <strong>14 lofts</strong> (el 4 es bodega) y el listado{" "}
            <strong>casa completa</strong> en Airbnb: importación iCal (solo
            lectura), arrastre de reservas entre alojamientos, reservas manuales y
            exportación iCal (delay de minutos, no en tiempo real).
          </p>
        </div>

        {(msg || err || pms.error) && (
          <div
            className={cn(
              "flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm",
              err || pms.error
                ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
            )}
          >
            <span>{err || pms.error || msg}</span>
            {msg && !err && !pms.error ? (
              <button
                type="button"
                className="shrink-0 text-xs underline opacity-80 hover:opacity-100"
                onClick={() => setMsg(null)}
              >
                Cerrar
              </button>
            ) : null}
          </div>
        )}

        <AdminCard
          title="Calendarios iCal — importar y exportar"
          subtitle="Varias URLs de Airbnb → una propiedad en el PMS · un solo iCal de salida con todos los bloqueos (OTAs + manual)"
        >
          <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
            Estado:{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              Airbnb en lectura; hacia Airbnb/OTAs solo bloqueos vía iCal
              exportado (minutos de retraso).
            </strong>
          </p>
          {pms.loading ? (
            <p className="text-sm text-zinc-500">Cargando propiedades…</p>
          ) : (
            <PmsCalendarHub
              properties={pms.properties}
              sources={pms.icalSources}
              reservations={pms.reservations}
              selectedPropertyId={selectedPropertyId}
              onSelectPropertyId={setSelectedPropertyId}
              exportUrl={exportUrl}
              busy={busy}
              isSuperAdmin={isSuperAdmin}
              onSyncAll={() => void syncNow()}
              onAddImportUrl={addImportUrl}
              onSyncOneSource={syncOneSource}
              onDeleteSource={deleteSource}
              onCopyExport={() => void copyExport()}
              onOpenExport={() => {
                if (exportUrl) window.open(exportUrl, "_blank", "noopener,noreferrer");
              }}
              onRegenerateToken={() => void regenerateToken()}
              onAddProperty={addProperty}
              onRenameProperty={renameProperty}
              onDeleteProperty={deleteProperty}
            />
          )}
        </AdminCard>

        <AdminCard
          title="Vista calendario"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider dark:border-white/10"
                onClick={() =>
                  pms.setViewFrom((v) =>
                    toISODateString(
                      new Date(parseISODate(v).getTime() - 7 * 86400000),
                    ),
                  )
                }
              >
                ← 7 días
              </button>
              <button
                type="button"
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider dark:border-white/10"
                onClick={() =>
                  pms.setViewFrom((v) =>
                    toISODateString(
                      new Date(parseISODate(v).getTime() + 7 * 86400000),
                    ),
                  )
                }
              >
                7 días →
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setResForm({
                    property_id: selectedPropertyId,
                    guest_name: "",
                    guest_phone: "",
                    check_in: pms.viewFrom,
                    check_out: addDays(pms.viewFrom, 3),
                    guests: "2",
                    price: "",
                    notes: "",
                    source: "direct",
                    referrer_name: "",
                    commission_amount: "",
                  });
                  setShowRes(true);
                }}
                className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
              >
                Nueva reserva
              </button>
            </div>
          }
        >
          {pms.loading ? (
            <p className="text-sm text-zinc-500">Cargando datos…</p>
          ) : (
            <ReservationsTimeline
              properties={pms.properties}
              reservations={pms.reservations}
              blocks={pms.blocks}
              viewFrom={pms.viewFrom}
              viewDays={pms.viewDays}
              onBlockRange={(propertyId, start, endInclusive) => {
                setBlockDraft({ propertyId, start, endInclusive });
                setShowBlock(true);
              }}
              onReservationPatch={async (payload) => {
                setErr(null);
                setMsg(null);
                const r = await patchReservation(payload);
                if (r.ok) {
                  setMsg("Reserva actualizada.");
                  await pms.refresh();
                }
                return r;
              }}
            />
          )}
        </AdminCard>
      </div>

      {showRes && (
        <Modal title="Nueva reserva" onClose={() => setShowRes(false)}>
          <form className="space-y-3" onSubmit={(e) => void submitReservation(e)}>
            <Field label="Propiedad">
              <select
                className="w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                value={resForm.property_id || selectedPropertyId}
                onChange={(e) =>
                  setResForm((f) => ({ ...f, property_id: e.target.value }))
                }
              >
                {pms.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre huésped">
              <input
                required
                className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                value={resForm.guest_name}
                onChange={(e) =>
                  setResForm((f) => ({ ...f, guest_name: e.target.value }))
                }
              />
            </Field>
            <Field label="Teléfono">
              <input
                className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                value={resForm.guest_phone}
                onChange={(e) =>
                  setResForm((f) => ({ ...f, guest_phone: e.target.value }))
                }
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Check-in">
                <input
                  required
                  type="date"
                  className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={resForm.check_in}
                  onChange={(e) =>
                    setResForm((f) => ({ ...f, check_in: e.target.value }))
                  }
                />
              </Field>
              <Field label="Check-out (exclusivo)">
                <input
                  required
                  type="date"
                  className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={resForm.check_out}
                  onChange={(e) =>
                    setResForm((f) => ({ ...f, check_out: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Huéspedes">
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={resForm.guests}
                  onChange={(e) =>
                    setResForm((f) => ({ ...f, guests: e.target.value }))
                  }
                />
              </Field>
              <Field label="Precio (opcional)">
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                  value={resForm.price}
                  onChange={(e) =>
                    setResForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Origen (color en calendario)">
              <select
                className="w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                value={resForm.source}
                onChange={(e) => {
                  const source = e.target.value;
                  setResForm((f) =>
                    source === "referral"
                      ? { ...f, source }
                      : {
                          ...f,
                          source,
                          referrer_name: "",
                          commission_amount: "",
                        },
                  );
                }}
              >
                <option value="direct">
                  Directa (sin comisión a terceros)
                </option>
                <option value="referral">
                  Referido (lleva comisión al referidor)
                </option>
                <option value="booking">Booking</option>
                <option value="expedia">Expedia</option>
                <option value="lofthouse14.com">lofthouse14.com</option>
              </select>
              <p className="mt-1 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                Airbnb llega por iCal. Directa y referido son reservas que cargas
                tú: solo &quot;Referido&quot; registra a quién pagar comisión.
              </p>
            </Field>
            {resForm.source === "referral" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Referidor (quién recibe la comisión)">
                  <input
                    required
                    className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                    placeholder="Nombre o canal"
                    value={resForm.referrer_name}
                    onChange={(e) =>
                      setResForm((f) => ({
                        ...f,
                        referrer_name: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Comisión estimada (opcional, COP)">
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                    placeholder="Ej. 50000"
                    value={resForm.commission_amount}
                    onChange={(e) =>
                      setResForm((f) => ({
                        ...f,
                        commission_amount: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            ) : null}
            <Field label="Notas">
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                value={resForm.notes}
                onChange={(e) =>
                  setResForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600"
                onClick={() => setShowRes(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-900"
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showBlock && blockDraft && (
        <Modal title="Bloquear fechas" onClose={() => setShowBlock(false)}>
          <form className="space-y-3" onSubmit={(e) => void submitBlock(e)}>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {blockDraft.start} → {blockDraft.endInclusive} (inclusive). Se
              guardará con fin exclusivo en base de datos.
            </p>
            <Field label="Motivo (ej. reparaciones)">
              <input
                className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Mantenimiento, uso propio…"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600"
                onClick={() => setShowBlock(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-900"
              >
                Crear bloqueo
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/10 bg-[#f2f0eb] p-5 shadow-2xl dark:border-white/10 dark:bg-[#1a1814]"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            className="rounded-full px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
