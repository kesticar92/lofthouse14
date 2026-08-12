"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import {
  addDays,
  format,
  isAfter,
  isSameDay,
  parseISO,
  startOfToday,
} from "date-fns";
import { es as esDateFns } from "date-fns/locale";
import { ArrowRight, CalendarDays, ChevronDown } from "lucide-react";
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
  required?: boolean;
};

type FocusField = "checkIn" | "checkOut";

export function StayDateRangePicker({
  checkIn,
  checkOut,
  onChange,
  className,
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

  const glassField = (active: boolean, filled: boolean) =>
    cn(
      "flex min-w-0 flex-1 flex-col rounded-2xl border px-4 py-3 text-left transition-all",
      "bg-white/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] backdrop-blur-xl",
      "dark:bg-zinc-900/45 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
      active
        ? "border-amber-500/70 ring-2 ring-amber-500/25 dark:border-amber-400/60"
        : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20",
      filled && !active && "border-zinc-300/80 dark:border-zinc-600/80",
    );

  const stepHint = !checkIn
    ? "Paso 1 · Elige tu fecha de entrada"
    : !checkOut
      ? "Paso 2 · Elige tu fecha de salida (después de la entrada)"
      : "Fechas confirmadas";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <span
        id={labelId}
        className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        Fechas de estadía
      </span>

      <div className="flex items-stretch gap-2 sm:gap-3">
        <button
          type="button"
          aria-labelledby={labelId}
          aria-expanded={open && focusField === "checkIn"}
          onClick={() => openPicker("checkIn")}
          className={glassField(
            open && focusField === "checkIn",
            Boolean(checkIn),
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Entrada
          </span>
          <span
            className={cn(
              "mt-1 truncate text-sm font-semibold",
              checkIn
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {checkIn ? formatDisplay(checkIn) : "Agregar fecha"}
          </span>
        </button>

        <div
          className="flex shrink-0 items-center text-zinc-400 dark:text-zinc-500"
          aria-hidden
        >
          <ArrowRight className="size-4" />
        </div>

        <button
          type="button"
          aria-expanded={open && focusField === "checkOut"}
          onClick={() => {
            if (!checkIn) {
              openPicker("checkIn");
              return;
            }
            openPicker("checkOut");
          }}
          className={glassField(
            open && focusField === "checkOut",
            Boolean(checkOut),
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Salida
          </span>
          <span
            className={cn(
              "mt-1 truncate text-sm font-semibold",
              checkOut
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            {checkOut
              ? formatDisplay(checkOut)
              : checkIn
                ? "Agregar fecha"
                : "Primero entrada"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl border border-black/10 px-3",
            "bg-white/50 backdrop-blur-xl transition hover:bg-white/70",
            "dark:border-white/10 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60",
            open && "ring-2 ring-amber-500/20",
          )}
          aria-label={open ? "Cerrar calendario" : "Abrir calendario"}
        >
          <ChevronDown
            className={cn(
              "size-5 text-zinc-600 transition-transform dark:text-zinc-300",
              open && "rotate-180",
            )}
          />
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
          aria-label="Seleccionar fechas de entrada y salida"
          className={cn(
            "absolute left-0 right-0 z-50 mt-3 overflow-hidden rounded-3xl border border-white/40 p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)]",
            "bg-white/75 backdrop-blur-2xl backdrop-saturate-150",
            "dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]",
            "sm:left-auto sm:right-0 sm:w-[min(100vw-2rem,720px)] sm:p-5",
          )}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {stepHint}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {selectingCheckout
                    ? "Toca un día posterior a tu entrada."
                    : "Toca el día en que llegas."}
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span
                className={cn(
                  "rounded-full px-3 py-1 font-semibold",
                  !checkIn
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                )}
              >
                Entrada
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 font-semibold",
                  selectingCheckout
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                    : checkOut
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                )}
              >
                Salida
              </span>
            </div>
          </div>

          <DayPicker
            key={`${focusField}-${checkIn}-${open}`}
            mode="range"
            locale={es}
            numberOfMonths={monthCount}
            showOutsideDays
            fixedWeeks
            disabled={{
              before:
                focusField === "checkOut" && checkIn
                  ? addDays(parseLocalISO(checkIn) ?? today, 1)
                  : today,
            }}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={
              (focusField === "checkOut" && parseLocalISO(checkIn)) ||
              selected?.from ||
              today
            }
            classNames={{
              root: "rdp-root w-full",
              months: "rdp-months flex flex-col gap-4 sm:flex-row sm:gap-8",
              month: "rdp-month space-y-3",
              month_caption: "rdp-month_caption flex justify-center pb-1",
              caption_label:
                "text-sm font-semibold capitalize text-zinc-900 dark:text-white",
              nav: "rdp-nav flex items-center gap-1",
              button_previous:
                "rdp-button_previous inline-flex size-9 items-center justify-center rounded-full bg-white/50 hover:bg-white/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700",
              button_next:
                "rdp-button_next inline-flex size-9 items-center justify-center rounded-full bg-white/50 hover:bg-white/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700",
              weekdays: "rdp-weekdays flex",
              weekday:
                "rdp-weekday w-10 text-center text-[0.65rem] font-semibold uppercase text-zinc-500",
              week: "rdp-week flex",
              day: "rdp-day p-0 text-center",
              day_button: cn(
                "inline-flex size-10 items-center justify-center rounded-full text-sm font-medium",
                "text-zinc-900 hover:bg-white/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
              ),
              selected:
                "rdp-selected bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900",
              range_start:
                "rdp-range_start rounded-l-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
              range_end:
                "rdp-range_end rounded-r-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
              range_middle:
                "rdp-range_middle rounded-none bg-zinc-200/70 dark:bg-zinc-700/50",
              today: "rdp-today font-bold ring-1 ring-amber-500/40 ring-inset",
              outside: "rdp-outside text-zinc-300 dark:text-zinc-600",
              disabled:
                "rdp-disabled text-zinc-300 opacity-40 dark:text-zinc-600",
            }}
          />

          {checkIn && checkOut ? (
            <div className="mt-4 flex justify-end border-t border-black/5 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
              >
                Listo
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
