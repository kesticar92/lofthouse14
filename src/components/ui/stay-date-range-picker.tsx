"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
import { ArrowRight, CalendarDays, X } from "lucide-react";
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

/** Solo calendario (sin tipear fechas): entrada → salida. Overlay fullscreen. */
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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    // Enfoca el panel para lectores de pantalla / teclado
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
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
            "border-[#1c1917]/18 bg-[#ebe6dc] text-[#141210]",
            "dark:border-[#f2f0eb]/15 dark:bg-[#1c1917] dark:text-[#f2f0eb]",
            active && "ring-2 ring-amber-600/35",
          )
        : cn(
            "rounded-2xl border px-4 py-3",
            "border-[#1c1917]/12 bg-[#f2f0eb]/80 backdrop-blur-xl dark:border-[#f2f0eb]/12 dark:bg-[#1c1917]/60",
            active && "border-amber-600/70 ring-2 ring-amber-500/25",
          ),
    );

  const stepHint = !checkIn
    ? "Paso 1 · Elige tu fecha de entrada"
    : !checkOut
      ? "Paso 2 · Elige tu fecha de salida"
      : "Fechas confirmadas · puedes ajustarlas";

  const calendarPanel =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[200] flex items-stretch justify-center sm:items-center sm:p-4">
            <button
              type="button"
              aria-label="Cerrar calendario"
              className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Calendario de entrada y salida"
              tabIndex={-1}
              className={cn(
                "relative z-[210] flex w-full flex-col overflow-hidden",
                "bg-[#f2f0eb] text-zinc-900 shadow-2xl",
                "dark:bg-zinc-950 dark:text-zinc-50",
                // Móvil: pantalla completa. Desktop: panel amplio centrado.
                "h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[min(92dvh,720px)]",
                "sm:w-full sm:max-w-[44rem] sm:rounded-3xl sm:border sm:border-zinc-200",
                "dark:sm:border-zinc-700",
              )}
            >
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200/80 px-4 py-4 dark:border-zinc-800 sm:px-6 sm:py-5">
                <div className="min-w-0 flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
                      Fechas de estadía
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {stepHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex shrink-0 items-stretch gap-2 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800 sm:px-6">
                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col rounded-2xl border px-3 py-2.5",
                    focusField === "checkIn"
                      ? "border-amber-600/70 bg-white ring-2 ring-amber-500/25 dark:bg-zinc-900"
                      : "border-zinc-200 bg-white/70 dark:border-zinc-700 dark:bg-zinc-900/60",
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Entrada
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 truncate text-sm font-semibold",
                      checkIn
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-500",
                    )}
                  >
                    {checkIn ? formatDisplay(checkIn) : "Elegir"}
                  </span>
                </div>
                <div
                  className="flex shrink-0 items-center text-zinc-400"
                  aria-hidden
                >
                  <ArrowRight className="size-4" />
                </div>
                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col rounded-2xl border px-3 py-2.5",
                    focusField === "checkOut"
                      ? "border-amber-600/70 bg-white ring-2 ring-amber-500/25 dark:bg-zinc-900"
                      : "border-zinc-200 bg-white/70 dark:border-zinc-700 dark:bg-zinc-900/60",
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Salida
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 truncate text-sm font-semibold",
                      checkOut
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-500",
                    )}
                  >
                    {checkOut ? formatDisplay(checkOut) : "Elegir"}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
                <DayPicker
                  mode="range"
                  locale={es}
                  numberOfMonths={monthCount}
                  selected={selected}
                  onSelect={handleSelect}
                  disabled={{ before: today }}
                  defaultMonth={selected?.from ?? today}
                  classNames={{
                    root: "mx-auto w-full max-w-xl",
                    months:
                      "flex flex-col gap-6 sm:flex-row sm:justify-center sm:gap-8",
                    month: "space-y-3",
                    month_caption: "flex justify-center pb-1",
                    caption_label:
                      "text-base font-semibold capitalize text-zinc-900 dark:text-zinc-50",
                    nav: "flex items-center gap-1",
                    button_previous:
                      "inline-flex size-9 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                    button_next:
                      "inline-flex size-9 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                    weekdays: "flex",
                    weekday:
                      "w-10 text-center text-[0.7rem] font-semibold uppercase text-zinc-500 sm:w-11",
                    week: "flex",
                    day: "p-0 text-center",
                    day_button: cn(
                      "inline-flex size-10 items-center justify-center rounded-full text-sm font-medium sm:size-11",
                      "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                    ),
                    selected:
                      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950",
                    range_start:
                      "rounded-l-full bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950",
                    range_end:
                      "rounded-r-full bg-zinc-900 text-white dark:bg-amber-500 dark:text-zinc-950",
                    range_middle:
                      "rounded-none bg-amber-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50",
                    today: "font-bold ring-1 ring-amber-500/50 ring-inset",
                    outside: "text-zinc-300 dark:text-zinc-600",
                    disabled: "text-zinc-300 opacity-40 dark:text-zinc-600",
                  }}
                />
              </div>

              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200/80 bg-[#ebe7df]/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    onChange("", "");
                    setFocusField("checkIn");
                  }}
                  className="rounded-full px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  disabled={!checkIn || !checkOut}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition",
                    checkIn && checkOut
                      ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                      : "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
                  )}
                >
                  Listo
                </button>
              </footer>
            </div>
          </div>,
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
