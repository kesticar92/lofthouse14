"use client";

import { createPortal } from "react-dom";
import { useMemo, useRef, useState } from "react";
import { addDays, nightCount, parseISODate, toISODateString } from "@/lib/pms/date-range";
import { reservationBarClasses, sourceLabel } from "@/lib/pms/colors";
import { detectSuspiciousGaps } from "@/lib/pms/gaps";
import type {
  AvailabilityBlockRow,
  PropertyRow,
  ReservationRow,
} from "@/lib/pms/types";
import { cn } from "@/lib/cn";

const CELL = 28;

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
    () =>
      Object.fromEntries(properties.map((p) => [p.id, p.name] as const)),
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
  const [anchor, setAnchor] = useState<{
    propertyId: string;
    day: string;
  } | null>(null);

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragListenersRef = useRef<{ cleanup: () => void } | null>(null);

  function clearDragUi() {
    dragRef.current = null;
    setDrag(null);
    document.body.style.removeProperty("user-select");
  }

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
      e.preventDefault();
      e.stopPropagation();

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
        const next: DragState = {
          ...d,
          deltaDays,
          hoverPropertyId: hover,
          clientX: ev.clientX,
          clientY: ev.clientY,
        };
        dragRef.current = next;
        setDrag(next);
      };

      const finish = async (ev: PointerEvent) => {
        if (ev.pointerId !== initial.pointerId) return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel);
        dragListenersRef.current = null;

        const d = dragRef.current;
        dragRef.current = null;
        setDrag(null);
        document.body.style.removeProperty("user-select");

        if (!d || !onReservationPatch) return;

        const newCheckIn = addDays(d.checkIn, d.deltaDays);
        const newCheckOut = addDays(d.checkOut, d.deltaDays);
        const newProp = d.hoverPropertyId;
        const unchanged =
          newProp === d.propertyId &&
          newCheckIn === d.checkIn &&
          newCheckOut === d.checkOut;
        if (unchanged) return;

        const res = await onReservationPatch({
          id: d.id,
          property_id: newProp,
          check_in: newCheckIn,
          check_out: newCheckOut,
        });
        if (!res.ok) {
          window.alert(res.error ?? "No se pudo mover la reserva");
        }
      };

      const cancel = (ev: PointerEvent) => {
        if (ev.pointerId !== initial.pointerId) return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel);
        dragListenersRef.current = null;
        clearDragUi();
      };

      dragListenersRef.current = {
        cleanup: () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", cancel);
        },
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", cancel);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
  }

  const totalW = viewDays * CELL;

  return (
    <div className="space-y-3">
      {onReservationPatch ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-800 dark:text-zinc-200">Arrastrar:</strong>{" "}
          mantén pulsada una reserva, muévela horizontalmente para cambiar fechas
          (misma duración) o hacia otra fila para asignarla a otro loft. Útil para
          repartir grupos que entraron como <em>casa completa</em> en Airbnb
          entre varios alojamientos.
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

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          Leyenda:
        </span>
        <LegendDot className="bg-sky-600" label="Booking" />
        <LegendDot className="bg-orange-500" label="Airbnb" />
        <LegendDot className="bg-amber-300" label="Expedia" />
        <LegendDot className="bg-violet-600" label="Web" />
        <LegendDot className="bg-emerald-600" label="Directa" />
        <LegendDot className="bg-rose-600" label="Referido" />
        <LegendDot className="bg-zinc-500" label="Bloqueo / reparación" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "block" ? "none" : "block");
            setAnchor(null);
          }}
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

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white/50 dark:border-white/10 dark:bg-zinc-950/40">
        <div style={{ minWidth: 140 + totalW }}>
          <div className="flex border-b border-black/10 dark:border-white/10">
            <div className="sticky left-0 z-30 w-[140px] shrink-0 bg-[#f2f0eb]/95 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-[#141210]/95 dark:text-zinc-400">
              Propiedad
            </div>
            <div className="flex" style={{ width: totalW }}>
              {days.map((d) => {
                const wd = ["D", "L", "M", "X", "J", "V", "S"][
                  parseISODate(d).getDay()
                ];
                return (
                  <div
                    key={d}
                    style={{ width: CELL }}
                    className="shrink-0 border-l border-black/5 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:border-white/5 dark:text-zinc-400"
                  >
                    <div>{wd}</div>
                    <div className="text-zinc-800 dark:text-zinc-100">
                      {d.slice(8)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {properties.map((p) => (
            <div
              key={p.id}
              data-pmsrow={p.id}
              className={cn(
                "flex border-b border-black/5 transition-colors last:border-0 dark:border-white/5",
                drag &&
                  drag.hoverPropertyId === p.id &&
                  drag.hoverPropertyId !== drag.propertyId
                  ? "bg-amber-500/10 ring-1 ring-inset ring-amber-600/25 dark:bg-amber-500/10"
                  : "",
              )}
            >
              <div className="sticky left-0 z-30 flex w-[140px] shrink-0 items-center bg-[#f2f0eb]/95 px-2 py-2 text-sm font-medium text-zinc-800 dark:bg-[#141210]/95 dark:text-zinc-100">
                <span className="line-clamp-3">{p.name}</span>
              </div>
              <div
                className="relative shrink-0"
                style={{ width: totalW, height: 56 }}
              >
                <div
                  className={cn(
                    "absolute inset-0 flex",
                    mode === "block" ? "z-20" : "z-0",
                  )}
                >
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      style={{ width: CELL }}
                      onClick={() => handleDayClick(p.id, d)}
                      className={cn(
                        "h-full shrink-0 border-l border-black/5 dark:border-white/5",
                        mode === "block" &&
                          anchor?.propertyId === p.id &&
                          anchor.day === d
                          ? "bg-amber-200/70 dark:bg-amber-900/50"
                          : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
                      )}
                    />
                  ))}
                </div>
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
                          "absolute top-2 z-10 h-10 rounded-md bg-zinc-500/40 ring-1 ring-zinc-600/25 dark:bg-zinc-600/45",
                          mode === "block" && "pointer-events-none",
                        )}
                        style={{
                          left: off * CELL,
                          width: Math.max(CELL, w * CELL),
                        }}
                      />
                    );
                  })}
                {reservations
                  .filter((r) => r.property_id === p.id && r.status !== "cancelled")
                  .map((r) => {
                    const vs = r.check_in < viewFrom ? viewFrom : r.check_in;
                    const ve = r.check_out > viewEndEx ? viewEndEx : r.check_out;
                    if (vs >= ve) return null;
                    const off = dayOffset(viewFrom, vs);
                    const w = nightCount(vs, ve);
                    const barW = Math.max(CELL, w * CELL);
                    const isDragging = drag?.id === r.id;
                    const tip = [
                      `Origen: ${sourceLabel(r.source)}`,
                      `Estado: ${r.status}`,
                      `${r.check_in} → ${r.check_out} (salida exclusiva)`,
                      r.guest_name ? `Huésped: ${r.guest_name}` : null,
                      r.referrer_name?.trim()
                        ? `Referidor: ${r.referrer_name.trim()}`
                        : null,
                      r.commission_amount != null &&
                      Number.isFinite(Number(r.commission_amount))
                        ? `Comisión estimada: ${formatMoneyCop(Number(r.commission_amount))}`
                        : null,
                      r.notes ? `Notas: ${r.notes}` : null,
                      r.ical_summary
                        ? `iCal SUMMARY: ${r.ical_summary}`
                        : null,
                      onReservationPatch
                        ? "Arrastra para mover entre lofts o fechas."
                        : null,
                    ]
                      .filter(Boolean)
                      .join("\n");
                    return (
                      <div
                        key={r.id}
                        title={tip}
                        tabIndex={mode === "block" ? -1 : 0}
                        onPointerDown={(e) => {
                          if (mode === "block") return;
                          const el = e.currentTarget;
                          const rect = el.getBoundingClientRect();
                          startReservationDrag(e, r, rect, barW);
                        }}
                        className={cn(
                          "absolute top-2 z-10 flex h-10 touch-none items-center overflow-hidden rounded-md px-1 text-[10px] font-semibold leading-tight shadow-sm select-none",
                          reservationBarClasses(r.source, r.status),
                          mode === "block" && "pointer-events-none",
                          onReservationPatch &&
                            mode !== "block" &&
                            "cursor-grab active:cursor-grabbing",
                          isDragging && "opacity-30",
                        )}
                        style={{
                          left: off * CELL,
                          width: barW,
                          touchAction: "none",
                        }}
                      >
                        {(r.guest_name || sourceLabel(r.source)) +
                          (r.guests ? ` · ${r.guests}p` : "")}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {drag &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[200] flex h-10 items-center overflow-hidden rounded-md px-1 text-[10px] font-semibold shadow-lg ring-2 ring-amber-500/60",
              drag.ghostClass,
            )}
            style={{
              left: drag.clientX - drag.grabDX,
              top: drag.clientY - drag.grabDy,
              width: drag.ghostW,
            }}
          >
            <span className="line-clamp-2 leading-tight">{drag.ghostLabel}</span>
            {drag.deltaDays !== 0 ||
            drag.hoverPropertyId !== drag.propertyId ? (
              <span className="ml-1 line-clamp-2 text-[9px] font-normal opacity-95">
                {addDays(drag.checkIn, drag.deltaDays)} ·{" "}
                {propertyNames[drag.hoverPropertyId] ?? "…"}
              </span>
            ) : null}
          </div>,
          document.body,
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
