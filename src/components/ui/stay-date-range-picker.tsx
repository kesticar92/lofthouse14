"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
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
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setMonthCount(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
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

      {open ? (
        <div
          role="dialog"
          aria-label="Calendario de entrada y salida"
          className={cn(
            "absolute z-[80] mt-2 overflow-hidden rounded-2xl border p-3 shadow-2xl sm:p-4",
            "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950",
            compact
              ? "left-1/2 w-[min(100vw-1.5rem,34rem)] -translate-x-1/2"
              : "left-0 right-0 sm:left-auto sm:right-0 sm:w-[min(100vw-2rem,40rem)]",
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
      ) : null}
    </div>
  );
}
