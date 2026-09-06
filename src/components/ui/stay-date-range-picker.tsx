"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import {
  format,
  isAfter,
  isSameDay,
  parseISO,
  startOfToday,
} from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { ArrowRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import "react-day-picker/style.css";

function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseLocalISO(iso: string): Date | undefined {
  if (!iso) return undefined;
  try {
    return parseISO(iso);
  } catch {
    return undefined;
  }
}

function formatDisplay(iso: string): string {
  const d = parseLocalISO(iso);
  if (!d) return "";
  return format(d, "d MMM yyyy", { locale: esDateFns });
}

export type StayDateRangePickerProps = {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  className?: string;
  /** Variante compacta para el banner del header. */
  compact?: boolean;
  required?: boolean;
};

type FocusField = "checkIn" | "checkOut";

type PanelPos = {
  top: number;
  left: number;
  width: number;
  placeAbove: boolean;
};

/** Solo calendario (sin tipear fechas): entrada → salida. */
export function StayDateRangePicker({
  checkIn,
  checkOut,
  onChange,
  className,
  compact = false,
  required,
}: StayDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [focusField, setFocusField] = useState<FocusField>("checkIn");
  const [monthCount, setMonthCount] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const today = startOfToday();
  const selectingCheckout = Boolean(checkIn && !checkOut);

  const selected: DateRange | undefined = useMemo(() => {
    const from = parseLocalISO(checkIn);
    const to = parseLocalISO(checkOut);
    if (!from && !to) return undefined;
    return { from, to };
  }, [checkIn, checkOut]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setMonthCount(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const updatePanelPos = () => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gutter = 12;
    const maxWidth = Math.min(
      window.innerWidth - gutter * 2,
      compact ? 340 : monthCount > 1 ? 640 : 360,
    );
    const width = Math.min(Math.max(rect.width, compact ? 280 : 300), maxWidth);
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(gutter, Math.min(left, window.innerWidth - width - gutter));

    const spaceBelow = window.innerHeight - rect.bottom - gutter;
    const spaceAbove = rect.top - gutter;
    const estimatedHeight = monthCount > 1 ? 380 : 360;
    const placeAbove =
      spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    setPanelPos({
      top: placeAbove ? rect.top - gutter : rect.bottom + 8,
      left,
      width,
      placeAbove,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }
    updatePanelPos();
    const onWin = () => updatePanelPos();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, monthCount, compact]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (selectingCheckout) setFocusField("checkOut");
  }, [selectingCheckout]);

  function openPicker(field: FocusField) {
    setFocusField(field);
    setOpen(true);
  }

  function handleSelect(range: DateRange | undefined) {
    const from = range?.from;
    const to = range?.to;

    if (!from) {
      onChange("", "");
      setFocusField("checkIn");
      return;
    }

    if (!to || isSameDay(from, to)) {
      onChange(toISO(from), "");
      setFocusField("checkOut");
      return;
    }

    if (!isAfter(to, from)) {
      onChange(toISO(from), "");
      setFocusField("checkOut");
      return;
    }

    onChange(toISO(from), toISO(to));
    setOpen(false);
  }

  const fieldClass = (active: boolean) =>
    cn(
      "flex min-w-0 flex-1 flex-col text-left transition",
      compact
        ? cn(
            "rounded-xl border px-2.5 py-1.5",
            "border-zinc-300 bg-white text-zinc-900",
            "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50",
            active && "ring-2 ring-amber-500/35",
          )
        : cn(
            "rounded-2xl border px-4 py-3",
            "border-black/10 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50",
            active && "border-amber-500/70 ring-2 ring-amber-500/25",
          ),
    );

  const stepHint = !checkIn
    ? "Paso 1 · Elige tu fecha de entrada"
    : !checkOut
      ? "Paso 2 · Elige tu fecha de salida"
      : "Fechas confirmadas";

  const calendarPanel =
    open && mounted && panelPos
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Cerrar calendario"
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Calendario de entrada y salida"
              style={{
                top: panelPos.placeAbove ? undefined : panelPos.top,
                bottom: panelPos.placeAbove
                  ? window.innerHeight - panelPos.top
                  : undefined,
                left: panelPos.left,
                width: panelPos.width,
              }}
              className={cn(
                "fixed z-[210] max-h-[min(70dvh,420px)] overflow-y-auto rounded-2xl border p-3 shadow-2xl sm:p-4",
                "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950",
              )}
            >
              <div className="mb-3 flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 sm:text-sm">
                  {stepHint}
                </p>
              </div>

              <DayPicker
                mode="range"
                locale={es}
                numberOfMonths={monthCount}
                selected={selected}
                onSelect={handleSelect}
                disabled={{ before: today }}
                defaultMonth={selected?.from ?? today}
                classNames={{
                  root: "w-full",
                  months: "flex flex-col gap-3 sm:flex-row sm:gap-6",
                  month: "space-y-2",
                  month_caption: "flex justify-center pb-1",
                  caption_label:
                    "text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-50",
                  nav: "flex items-center gap-1",
                  button_previous:
                    "inline-flex size-8 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                  button_next:
                    "inline-flex size-8 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                  weekdays: "flex",
                  weekday:
                    "w-9 text-center text-[0.65rem] font-semibold uppercase text-zinc-500",
                  week: "flex",
                  day: "p-0 text-center",
                  day_button: cn(
                    "inline-flex size-9 items-center justify-center rounded-full text-sm font-medium",
                    "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                  ),
                  selected:
                    "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950",
                  range_start:
                    "rounded-l-full bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950",
                  range_end:
                    "rounded-r-full bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950",
                  range_middle: "rounded-none bg-zinc-200 dark:bg-zinc-700",
                  today: "font-bold ring-1 ring-amber-500/50 ring-inset",
                  outside: "text-zinc-300 dark:text-zinc-600",
                  disabled: "text-zinc-300 opacity-40 dark:text-zinc-600",
                }}
              />
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {!compact ? (
        <span
          id={labelId}
          className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Fechas de estadía
        </span>
      ) : (
        <span id={labelId} className="sr-only">
          Fechas de estadía
        </span>
      )}

      <div
        className={cn(
          "flex items-stretch gap-1.5",
          !compact && "gap-2 sm:gap-3",
        )}
      >
        <button
          type="button"
          aria-labelledby={labelId}
          aria-expanded={open && focusField === "checkIn"}
          onClick={() => openPicker("checkIn")}
          className={fieldClass(open && focusField === "checkIn")}
        >
          <span
            className={cn(
              "font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            Entrada
          </span>
          <span
            className={cn(
              "mt-0.5 truncate font-semibold",
              compact ? "text-xs" : "text-sm",
              checkIn
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {checkIn ? formatDisplay(checkIn) : "Elegir"}
          </span>
        </button>

        <div
          className="flex shrink-0 items-center text-zinc-400 dark:text-zinc-500"
          aria-hidden
        >
          <ArrowRight className={compact ? "size-3.5" : "size-4"} />
        </div>

        <button
          type="button"
          aria-expanded={open && focusField === "checkOut"}
          onClick={() => openPicker(checkIn ? "checkOut" : "checkIn")}
          className={fieldClass(open && focusField === "checkOut")}
        >
          <span
            className={cn(
              "font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            Salida
          </span>
          <span
            className={cn(
              "mt-0.5 truncate font-semibold",
              compact ? "text-xs" : "text-sm",
              checkOut
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {checkOut ? formatDisplay(checkOut) : "Elegir"}
          </span>
        </button>
      </div>

      {required && !checkOut ? (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={checkOut}
          onChange={() => {}}
          required
          aria-hidden
        />
      ) : null}

      {calendarPanel}
    </div>
  );
}
