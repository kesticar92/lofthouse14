"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchAdminSession } from "@/lib/auth-client";
import { addDays, parseISODate, toISODateString } from "@/lib/pms/date-range";
import type { usePmsModule } from "@/hooks/usePms";
import {
  deleteIcalSourceById,
  deletePropertyById,
  patchProperty,
  patchReservationMove,
  postPmsJson,
  requestPmsIcalSync,
} from "@/features/pms/admin-api";
import type { ReservationFormState } from "@/features/pms/components/reservation-modals";

type Pms = ReturnType<typeof usePmsModule>;

function siteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://lofthouse14.com"
  );
}

const emptyResForm = (): ReservationFormState => ({
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

export function useReservasAdminPage(pms: Pms) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [showRes, setShowRes] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [blockDraft, setBlockDraft] = useState<{
    propertyId: string;
    start: string;
    endInclusive: string;
  } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const [resForm, setResForm] = useState<ReservationFormState>(emptyResForm);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  useEffect(() => {
    fetchAdminSession().then((s) => {
      if (s && (s.role === "super_admin" || s.role === "admin")) {
        setIsSuperAdmin(true);
      }
    });
  }, []);

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

  const syncNow = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    const r = await postPmsJson<{ sources: number; results: unknown[] }>(
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
  }, [pms]);

  const copyExport = useCallback(async () => {
    if (!exportUrl) return;
    try {
      await navigator.clipboard.writeText(exportUrl);
      setMsg("URL del calendario exportado copiada.");
    } catch {
      setErr("No se pudo copiar al portapapeles.");
    }
  }, [exportUrl]);

  const addImportUrl = useCallback(
    async (url: string): Promise<{ ok: boolean; error?: string }> => {
      if (!selectedPropertyId) {
        return { ok: false, error: "Elige una propiedad." };
      }
      setBusy(true);
      setErr(null);
      setMsg(null);
      const r = await postPmsJson<{ sync?: { message?: string } }>(
        "/api/admin/pms/ical-sources",
        { property_id: selectedPropertyId, url, sync_now: true },
      );
      setBusy(false);
      if (!r.ok) {
        setErr(r.error ?? "Error al añadir el enlace.");
        return { ok: false, error: r.error };
      }
      setMsg(
        r.data?.sync?.message?.trim() || "Enlace iCal añadido y sincronizado.",
      );
      await pms.refresh();
      return { ok: true };
    },
    [pms, selectedPropertyId],
  );

  const syncOneSource = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      setErr(null);
      setMsg(null);
      const j = await requestPmsIcalSync(id);
      if (!j.ok) {
        setErr(j.error);
        return { ok: false, error: j.error };
      }
      setMsg(j.message ?? "Fuente sincronizada.");
      await pms.refresh();
      return { ok: true };
    },
    [pms],
  );

  const deleteSource = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      const del = await deleteIcalSourceById(id);
      if (!del.ok) {
        setErr(del.error);
        return { ok: false, error: del.error };
      }
      setMsg(
        "Enlace iCal eliminado. Las reservas importadas desde él también se borraron del calendario.",
      );
      await pms.refresh();
      return { ok: true };
    },
    [pms],
  );

  const regenerateToken = useCallback(async () => {
    const pid = selectedPropertyId;
    if (!pid) return;
    setBusy(true);
    setErr(null);
    const reg = await patchProperty({
      id: pid,
      regenerate_ical_token: true,
    });
    setBusy(false);
    if (!reg.ok) {
      setErr(reg.error);
      return;
    }
    setMsg("Token de exportación regenerado.");
    await pms.refresh();
  }, [pms, selectedPropertyId]);

  const addProperty = useCallback(
    async (name: string): Promise<{ ok: boolean; error?: string }> => {
      setBusy(true);
      setErr(null);
      const r = await postPmsJson("/api/admin/pms/properties", { name });
      setBusy(false);
      if (!r.ok) {
        setErr(r.error ?? "Error");
        return { ok: false, error: r.error };
      }
      setMsg(`Anuncio "${name}" creado.`);
      await pms.refresh();
      return { ok: true };
    },
    [pms],
  );

  const renameProperty = useCallback(
    async (
      id: string,
      name: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      setBusy(true);
      setErr(null);
      const ren = await patchProperty({ id, name });
      setBusy(false);
      if (!ren.ok) {
        setErr(ren.error);
        return { ok: false, error: ren.error };
      }
      setMsg("Anuncio renombrado.");
      await pms.refresh();
      return { ok: true };
    },
    [pms],
  );

  const deleteProperty = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      setBusy(true);
      setErr(null);
      const del = await deletePropertyById(id);
      setBusy(false);
      if (!del.ok) {
        setErr(del.error);
        return { ok: false, error: del.error };
      }
      setMsg(
        "Anuncio eliminado. También se borraron sus reservas, enlaces iCal, bloqueos y tareas de aseo asociadas.",
      );
      await pms.refresh();
      return { ok: true };
    },
    [pms],
  );

  const submitReservation = useCallback(
    async (e: React.FormEvent) => {
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
      const r = await postPmsJson("/api/admin/pms/reservations", {
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
    },
    [pms, resForm, selectedPropertyId],
  );

  const submitBlock = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!blockDraft) return;
      setBusy(true);
      setErr(null);
      const r = await postPmsJson("/api/admin/pms/blocks", {
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
    },
    [blockDraft, blockReason, pms],
  );

  const openNewReservation = useCallback(() => {
    setResForm({
      ...emptyResForm(),
      property_id: selectedPropertyId,
      check_in: pms.viewFrom,
      check_out: addDays(pms.viewFrom, 3),
    });
    setShowRes(true);
  }, [pms.viewFrom, selectedPropertyId]);

  const onReservationPatch = useCallback(
    async (payload: {
      id: string;
      property_id: string;
      check_in: string;
      check_out: string;
    }) => {
      setErr(null);
      setMsg(null);
      const r = await patchReservationMove(payload);
      if (r.ok) {
        setMsg("Reserva actualizada.");
        await pms.refresh();
      }
      return r;
    },
    [pms],
  );

  const shiftView = useCallback(
    (deltaDays: number) => {
      pms.setViewFrom((v) =>
        toISODateString(
          new Date(parseISODate(v).getTime() + deltaDays * 86400000),
        ),
      );
    },
    [pms],
  );

  return {
    msg,
    err,
    busy,
    isSuperAdmin,
    setMsg,
    showRes,
    setShowRes,
    showBlock,
    setShowBlock,
    blockDraft,
    setBlockDraft,
    blockReason,
    setBlockReason,
    resForm,
    setResForm,
    selectedPropertyId,
    setSelectedPropertyId,
    exportUrl,
    syncNow,
    copyExport,
    addImportUrl,
    syncOneSource,
    deleteSource,
    regenerateToken,
    addProperty,
    renameProperty,
    deleteProperty,
    submitReservation,
    submitBlock,
    openNewReservation,
    onReservationPatch,
    shiftView,
  };
}
