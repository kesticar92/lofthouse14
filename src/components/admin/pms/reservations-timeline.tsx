"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  nightCount,
  parseISODate,
  toISODateString,
} from "@/lib/pms/date-range";
import { reservationBarClasses, sourceLabel } from "@/lib/pms/colors";
import { detectSuspiciousGaps } from "@/lib/pms/gaps";
import type {
  AvailabilityBlockRow,
  PropertyRow,
  ReservationRow,
} from "@/lib/pms/types";
import { cn } from "@/lib/cn";

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL = 28;
const ROW_H = 48;
const BAR_H = 22;
const BAR_TOP = Math.round((ROW_H - BAR_H) / 2);

// ─── Read-only detection ──────────────────────────────────────────────────────
/** Reservas que NO se pueden mover en el PMS: las que provienen de un iCal
 *  externo (Airbnb hoy) porque arrastrarlas aquí no actualizaría el calendario
 *  origen y generaría conflictos de disponibilidad. */
function isReadOnlyReservation(r: ReservationRow): boolean {
  if (r.source?.toLowerCase() === "airbnb") return true;
  if (r.ical_source_id) return true;
  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMoneyCop(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function dayOffset(from: string, d: string): number {
  return Math.round(
    (parseISODate(d).getTime() - parseISODate(from).getTime()) / 86400000,
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "none" | "block";

type DragState = {
  id: string;
  pointerId: number;
  originClientX: number;
  checkIn: string;
  checkOut: string;
  propertyId: string;
  deltaDays: number;
  hoverPropertyId: string;
  ghostW: number;
  grabDX: number;
  grabDy: number;
  ghostLabel: string;
  ghostClass: string;
  clientX: number;
  clientY: number;
};

type TooltipState = {
  r: ReservationRow;
  anchorRect: DOMRect;
} | null;

// ─── Rich Tooltip (Desktop hover) ────────────────────────────────────────────
function ReservationTooltip({
  r,
  anchorRect,
}: {
  r: ReservationRow;
  anchorRect: DOMRect;
}) {
  const nights = nightCount(r.check_in, r.check_out);
  const readOnly = isReadOnlyReservation(r);

  const [pos, setPos] = useState({ top: 0, left: 0, above: false });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tip = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - anchorRect.bottom - 8;
    const above = spaceBelow < tip.height + 8;
    let left = anchorRect.left;
    if (left + tip.width + 8 > vw) left = vw - tip.width - 8;
    if (left < 8) left = 8;
    const top = above
      ? anchorRect.top - tip.height - 8
      : anchorRect.bottom + 8;
    setPos({ top, left, above });
  }, [anchorRect]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-[300] w-64 rounded-xl border border-black/10 bg-white/95 p-3 shadow-2xl ring-1 ring-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/95 dark:ring-white/5"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Header with source color dot */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
            reservationBarClasses(r.source, r.status).split(" ")[0],
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {r.guest_name || "Reserva " + sourceLabel(r.source)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {sourceLabel(r.source)}
          </p>
        </div>
      </div>

      <div className="mt-2 space-y-1 text-[11px]">
        <Row label="Check-in" value={fmtDate(r.check_in)} />
        <Row label="Check-out" value={fmtDate(r.check_out)} />
        <Row label="Duración" value={`${nights} noche${nights !== 1 ? "s" : ""}`} />
        {r.guests ? <Row label="Huéspedes" value={`${r.guests} persona${r.guests !== 1 ? "s" : ""}`} /> : null}
        {r.price ? <Row label="Valor" value={formatMoneyCop(Number(r.price))} highlight /> : null}
        {r.referrer_name?.trim() ? <Row label="Referidor" value={r.referrer_name.trim()} /> : null}
        {r.commission_amount != null && Number.isFinite(Number(r.commission_amount)) ? (
          <Row label="Comisión estimada" value={formatMoneyCop(Number(r.commission_amount))} />
        ) : null}
        {r.guest_phone ? <Row label="Teléfono" value={r.guest_phone} /> : null}
        {r.ical_summary ? <Row label="iCal" value={r.ical_summary} /> : null}
        {r.notes ? (
          <div className="mt-2 rounded-lg bg-zinc-100 p-2 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <span className="font-semibold">Notas: </span>
            {r.notes}
          </div>
        ) : null}
      </div>

        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-black/5 pt-2 dark:border-white/5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            r.status === "confirmed"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : r.status === "blocked"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          {r.status}
        </span>
        {readOnly ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-zinc-900/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-zinc-100/90 dark:text-zinc-900"
            title="No se puede mover desde el PMS porque proviene de un calendario iCal externo."
          >
            iCal · solo lectura
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={cn(
          "text-right font-medium text-zinc-800 dark:text-zinc-200",
          highlight && "font-semibold text-emerald-700 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Mobile Modal ─────────────────────────────────────────────────────────────
function ReservationModal({
  r,
  propertyName,
  onClose,
}: {
  r: ReservationRow;
  propertyName: string;
  onClose: () => void;
}) {
  const nights = nightCount(r.check_in, r.check_out);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-8 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-1 h-3 w-3 shrink-0 rounded-full",
                reservationBarClasses(r.source, r.status).split(" ")[0],
              )}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {r.guest_name || "Reserva " + sourceLabel(r.source)}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {sourceLabel(r.source)} · {propertyName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <ModalRow label="Check-in" value={fmtDate(r.check_in)} />
            <ModalRow label="Check-out" value={fmtDate(r.check_out)} />
            <ModalRow label="Duración" value={`${nights} noche${nights !== 1 ? "s" : ""}`} />
            {r.guests ? <ModalRow label="Huéspedes" value={`${r.guests} persona${r.guests !== 1 ? "s" : ""}`} /> : null}
            {r.price ? <ModalRow label="Valor" value={formatMoneyCop(Number(r.price))} highlight /> : null}
            {r.guest_phone ? <ModalRow label="Teléfono" value={r.guest_phone} /> : null}
            {r.referrer_name?.trim() ? <ModalRow label="Referidor" value={r.referrer_name.trim()} /> : null}
            {r.commission_amount != null && Number.isFinite(Number(r.commission_amount)) ? (
              <ModalRow label="Comisión estimada" value={formatMoneyCop(Number(r.commission_amount))} />
            ) : null}
            {r.ical_summary ? <ModalRow label="iCal" value={r.ical_summary} /> : null}
          </div>

          {r.notes ? (
            <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="font-semibold">Notas: </span>
              {r.notes}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                r.status === "confirmed"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : r.status === "blocked"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
              )}
            >
              {r.status}
            </span>
            {isReadOnlyReservation(r) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white dark:bg-zinc-100/90 dark:text-zinc-900">
                iCal · solo lectura
              </span>
            ) : null}
          </div>
          {isReadOnlyReservation(r) ? (
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
              Esta reserva proviene de un calendario iCal externo (
              {sourceLabel(r.source)}). No puede arrastrarse en el PMS — para
              moverla, hazlo en el panel de {sourceLabel(r.source)} y aquí se
              actualizará en la próxima sincronización.
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModalRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={cn(
          "text-right font-medium text-zinc-800 dark:text-zinc-200",
          highlight && "font-semibold text-emerald-700 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function rowFromPoint(clientX: number, clientY: number): string | null {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    let cur: Element | null = el;
    while (cur) {
      if (cur instanceof HTMLElement && cur.dataset.pmsrow) {
        return cur.dataset.pmsrow;
      }
      cur = cur.parentElement;
    }
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReservationsTimeline({
  properties,
  reservations,
  blocks,
  viewFrom,
  viewDays,
  onBlockRange,
  onReservationPatch,
}: {
  properties: PropertyRow[];
  reservations: ReservationRow[];
  blocks: AvailabilityBlockRow[];
  viewFrom: string;
  viewDays: number;
  onBlockRange: (propertyId: string, start: string, endInclusive: string) => void;
  onReservationPatch?: (payload: {
    id: string;
    property_id: string;
    check_in: string;
    check_out: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const viewEndEx = addDays(viewFrom, viewDays);
  const days = useMemo(
    () =>
      Array.from({ length: viewDays }, (_, i) =>
        toISODateString(new Date(parseISODate(viewFrom).getTime() + i * 86400000)),
      ),
    [viewFrom, viewDays],
  );

  const propertyNames = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.name] as const)),
    [properties],
  );

  const gapAlerts = useMemo(
    () =>
      detectSuspiciousGaps(
        reservations.map((r) => ({
          property_id: r.property_id,
          check_in: r.check_in,
          check_out: r.check_out,
          status: r.status,
        })),
        propertyNames,
      ),
    [reservations, propertyNames],
  );

  const [mode, setMode] = useState<Mode>("none");
  const [anchor, setAnchor] = useState<{ propertyId: string; day: string } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Rich tooltip state (desktop hover)
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  // Mobile modal state
  const [modalRes, setModalRes] = useState<ReservationRow | null>(null);

  const clearDragUi = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
    document.body.style.removeProperty("user-select");
  }, []);

  function handleDayClick(propertyId: string, day: string) {
    if (mode !== "block") return;
    if (!anchor || anchor.propertyId !== propertyId) {
      setAnchor({ propertyId, day });
      return;
    }
    const a = anchor.day;
    const b = day;
    const [start, endInclusive] = a <= b ? [a, b] : [b, a];
    onBlockRange(propertyId, start, endInclusive);
    setAnchor(null);
    setMode("none");
  }

  function startReservationDrag(
    e: React.PointerEvent,
    r: ReservationRow,
    barScreenRect: DOMRect,
    barWidthPx: number,
  ) {
    if (mode === "block" || !onReservationPatch) return;
    if (r.status === "cancelled") return;
    if (isReadOnlyReservation(r)) return;
    e.preventDefault();
    e.stopPropagation();
    setTooltip(null);

    const ghostLabel = r.guest_name?.trim() || sourceLabel(r.source);
    const ghostClass = reservationBarClasses(r.source, r.status);
    const initial: DragState = {
      id: r.id,
      pointerId: e.pointerId,
      originClientX: e.clientX,
      checkIn: r.check_in,
      checkOut: r.check_out,
      propertyId: r.property_id,
      deltaDays: 0,
      hoverPropertyId: r.property_id,
      ghostW: Math.max(CELL, barWidthPx),
      grabDX: e.clientX - barScreenRect.left,
      grabDy: e.clientY - barScreenRect.top,
      ghostLabel,
      ghostClass,
      clientX: e.clientX,
      clientY: e.clientY,
    };
    dragRef.current = initial;
    setDrag(initial);
    document.body.style.userSelect = "none";

    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      const deltaDays = Math.round((ev.clientX - d.originClientX) / CELL);
      const hover = rowFromPoint(ev.clientX, ev.clientY) ?? d.hoverPropertyId;
      const next: DragState = { ...d, deltaDays, hoverPropertyId: hover, clientX: ev.clientX, clientY: ev.clientY };
      dragRef.current = next;
      setDrag(next);
    };

    const finish = async (ev: PointerEvent) => {
      if (ev.pointerId !== initial.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);

      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      document.body.style.removeProperty("user-select");

      if (!d || !onReservationPatch) return;
      const newCheckIn = addDays(d.checkIn, d.deltaDays);
      const newCheckOut = addDays(d.checkOut, d.deltaDays);
      const newProp = d.hoverPropertyId;
      if (newProp === d.propertyId && newCheckIn === d.checkIn && newCheckOut === d.checkOut) return;
      const res = await onReservationPatch({ id: d.id, property_id: newProp, check_in: newCheckIn, check_out: newCheckOut });
      if (!res.ok) window.alert(res.error ?? "No se pudo mover la reserva");
    };

    const cancel = (ev: PointerEvent) => {
      if (ev.pointerId !== initial.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      clearDragUi();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
  }

  const totalW = viewDays * CELL;
  const today = toISODateString(new Date());

  return (
    <div className="space-y-3">
      {onReservationPatch ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-800 dark:text-zinc-200">Arrastrar:</strong>{" "}
          mantén pulsada una reserva y muévela para cambiar fechas o loft. Las
          reservas marcadas con <em className="font-semibold">iCal</em> (Airbnb
          y otros calendarios sincronizados) son de solo lectura: edítalas en
          su panel de origen.
        </p>
      ) : null}

      {gapAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Posibles huecos de 1 noche</p>
          <ul className="mt-1 list-inside list-disc text-amber-900/90 dark:text-amber-50/90">
            {gapAlerts.map((g, i) => (
              <li key={i}>
                {g.property_name ?? g.property_id}: {g.gap_start} → {g.gap_end}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">Leyenda:</span>
        <LegendDot className="bg-sky-600" label="Booking" />
        <LegendDot className="bg-orange-500" label="Airbnb" />
        <LegendDot className="bg-amber-300" label="Expedia" />
        <LegendDot className="bg-violet-600" label="Web" />
        <LegendDot className="bg-emerald-600" label="Directa" />
        <LegendDot className="bg-rose-600" label="Referido" />
        <LegendDot className="bg-zinc-500" label="Bloqueo" />
      </div>

      {/* Block mode toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setMode(mode === "block" ? "none" : "block"); setAnchor(null); }}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition",
            mode === "block"
              ? "border-amber-700 bg-amber-600 text-white dark:border-amber-400 dark:bg-amber-500"
              : "border-black/10 bg-white/80 dark:border-white/10 dark:bg-zinc-800/80",
          )}
        >
          {mode === "block" ? "Cancelar bloqueo" : "Bloquear fechas (2 clics)"}
        </button>
        {mode === "block" && (
          <span className="text-xs text-zinc-600 dark:text-zinc-300">
            Elige propiedad y día inicial, luego día final.
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white/50 dark:border-white/10 dark:bg-zinc-950/40">
        <div style={{ minWidth: 140 + totalW }}>
          {/* Header row */}
          <div className="flex border-b border-black/10 dark:border-white/10">
            <div className="sticky left-0 z-30 w-[140px] shrink-0 bg-[#f2f0eb]/95 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-[#141210]/95 dark:text-zinc-400">
              Anuncio
            </div>
            <div className="flex" style={{ width: totalW }}>
              {days.map((d) => {
                const wd = ["D", "L", "M", "X", "J", "V", "S"][parseISODate(d).getDay()];
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    style={{ width: CELL }}
                    className={cn(
                      "shrink-0 border-l border-black/5 py-2 text-center text-[10px] font-medium uppercase tracking-wider dark:border-white/5",
                      isToday
                        ? "bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                        : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    <div>{wd}</div>
                    <div className={cn("font-semibold", isToday ? "text-amber-900 dark:text-amber-200" : "text-zinc-800 dark:text-zinc-100")}>
                      {d.slice(8)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property rows */}
          {properties.map((p) => (
            <div
              key={p.id}
              data-pmsrow={p.id}
              className={cn(
                "flex border-b border-black/5 transition-colors last:border-0 dark:border-white/5",
                drag?.hoverPropertyId === p.id && drag.hoverPropertyId !== drag.propertyId
                  ? "bg-amber-500/10 ring-1 ring-inset ring-amber-600/25"
                  : "",
              )}
            >
              {/* Property name sticky */}
              <div className="sticky left-0 z-30 flex w-[140px] shrink-0 items-center bg-[#f2f0eb]/95 px-2 py-2 text-sm font-medium text-zinc-800 dark:bg-[#141210]/95 dark:text-zinc-100">
                <span className="line-clamp-3 text-xs">{p.name}</span>
              </div>

              {/* Day cells */}
              <div className="relative shrink-0" style={{ width: totalW, height: ROW_H }}>
                {/* Clickable day cells */}
                <div className={cn("absolute inset-0 flex", mode === "block" ? "z-20" : "z-0")}>
                  {days.map((d) => {
                    const isToday = d === today;
                    return (
                      <button
                        key={d}
                        type="button"
                        style={{ width: CELL }}
                        onClick={() => handleDayClick(p.id, d)}
                        className={cn(
                          "h-full shrink-0 border-l border-black/5 dark:border-white/5",
                          isToday && "bg-amber-500/8 dark:bg-amber-500/10",
                          mode === "block" && anchor?.propertyId === p.id && anchor.day === d
                            ? "bg-amber-200/70 dark:bg-amber-900/50"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
                        )}
                      />
                    );
                  })}
                </div>

                {/* Block bars */}
                {blocks
                  .filter((b) => b.property_id === p.id)
                  .map((b) => {
                    const vs = b.start_date < viewFrom ? viewFrom : b.start_date;
                    const ve = b.end_date > viewEndEx ? viewEndEx : b.end_date;
                    if (vs >= ve) return null;
                    const off = dayOffset(viewFrom, vs);
                    const w = nightCount(vs, ve);
                    return (
                      <div
                        key={b.id}
                        title={`Bloqueo: ${b.start_date} → ${addDays(b.end_date, -1)} · ${b.reason || "—"}`}
                        className={cn(
                          "absolute z-10 rounded-full bg-zinc-400/50 ring-1 ring-zinc-600/25 dark:bg-zinc-600/50",
                          mode === "block" && "pointer-events-none",
                        )}
                        style={{
                          left: off * CELL + Math.round(CELL / 3),
                          width: Math.max(Math.round(CELL * 2 / 3), w * CELL),
                          top: BAR_TOP,
                          height: BAR_H,
                        }}
                      />
                    );
                  })}

                {/* Reservation bars */}
                {reservations
                  .filter((r) => r.property_id === p.id && r.status !== "cancelled")
                  .map((r) => {
                    const vs = r.check_in < viewFrom ? viewFrom : r.check_in;
                    const ve = r.check_out > viewEndEx ? viewEndEx : r.check_out;
                    if (vs >= ve) return null;

                    // Clip offsets
                    const off = dayOffset(viewFrom, vs);
                    const w = nightCount(vs, ve);

                    // Bar position: starts at 1/3 into check-in cell, ends at 1/3 into check-out cell
                    // Width = w * CELL (includes the partial segments at both ends)
                    const isClippedStart = r.check_in < viewFrom;
                    const isClippedEnd = r.check_out > viewEndEx;

                    const barLeft = isClippedStart ? off * CELL : off * CELL + Math.round(CELL / 3);
                    const barRight = isClippedEnd
                      ? (off + w) * CELL
                      : (off + w) * CELL + Math.round(CELL / 3);
                    const barWidth = Math.max(Math.round(CELL * 2 / 3), barRight - barLeft);

                    const isDragging = drag?.id === r.id;
                    const readOnly = isReadOnlyReservation(r);
                    const displayName = r.guest_name?.trim()
                      ? r.guest_name.trim()
                      : sourceLabel(r.source);
                    const suffix = r.guests ? ` · ${r.guests}` : "";

                    return (
                      <div
                        key={r.id}
                        tabIndex={mode === "block" ? -1 : 0}
                        title={
                          readOnly
                            ? `${displayName} — sincronizada desde ${sourceLabel(r.source)} (iCal, solo lectura)`
                            : `${displayName} — arrastra para reprogramar`
                        }
                        onMouseEnter={(e) => {
                          if (drag) return;
                          setTooltip({ r, anchorRect: e.currentTarget.getBoundingClientRect() });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (drag) return;
                          setTooltip(null);
                          setModalRes(r);
                        }}
                        onPointerDown={(e) => {
                          if (mode === "block") return;
                          if (readOnly) return;
                          const el = e.currentTarget;
                          const rect = el.getBoundingClientRect();
                          startReservationDrag(e, r, rect, barWidth);
                        }}
                        className={cn(
                          "absolute z-10 flex touch-none items-center gap-1 overflow-hidden px-2 text-[11px] font-semibold leading-none shadow select-none",
                          // Rounded corners: only at the natural start/end of the reservation
                          !isClippedStart && !isClippedEnd && "rounded-full",
                          !isClippedStart && isClippedEnd && "rounded-l-full",
                          isClippedStart && !isClippedEnd && "rounded-r-full",
                          reservationBarClasses(r.source, r.status),
                          mode === "block" && "pointer-events-none",
                          mode !== "block" &&
                            (readOnly
                              ? "cursor-pointer"
                              : onReservationPatch
                                ? "cursor-grab active:cursor-grabbing"
                                : "cursor-pointer"),
                          readOnly && "ring-2 ring-offset-0 ring-black/15 dark:ring-white/20",
                          isDragging && "opacity-30",
                        )}
                        style={{
                          left: barLeft,
                          width: barWidth,
                          top: BAR_TOP,
                          height: BAR_H,
                          touchAction: "none",
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {displayName}
                          {suffix}
                        </span>
                        {readOnly && barWidth >= 64 ? (
                          <span
                            aria-hidden
                            className="shrink-0 rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/95"
                          >
                            iCal
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      {drag &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[200] flex items-center overflow-hidden rounded-full px-1.5 text-[9px] font-semibold shadow-lg ring-2 ring-amber-500/60",
              drag.ghostClass,
            )}
            style={{
              left: drag.clientX - drag.grabDX,
              top: drag.clientY - drag.grabDy,
              width: drag.ghostW,
              height: BAR_H,
            }}
          >
            <span className="truncate leading-none">{drag.ghostLabel}</span>
            {drag.deltaDays !== 0 || drag.hoverPropertyId !== drag.propertyId ? (
              <span className="ml-1 shrink-0 text-[8px] font-normal opacity-90">
                {addDays(drag.checkIn, drag.deltaDays)} · {propertyNames[drag.hoverPropertyId] ?? "…"}
              </span>
            ) : null}
          </div>,
          document.body,
        )}

      {/* Desktop tooltip */}
      {tooltip && !drag && typeof document !== "undefined" &&
        createPortal(
          <ReservationTooltip r={tooltip.r} anchorRect={tooltip.anchorRect} />,
          document.body,
        )}

      {/* Mobile / click modal */}
      {modalRes && typeof document !== "undefined" && (
        <ReservationModal
          r={modalRes}
          propertyName={propertyNames[modalRes.property_id] ?? "—"}
          onClose={() => setModalRes(null)}
        />
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}
