"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Users } from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import { saveStayDraft } from "@/lib/stay-draft";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import {
  LOFT_CATEGORIES,
  availableLoftsForGuests,
  categoryFitsGuests,
  type LoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";

const GUEST_OPTIONS = Array.from({ length: site.maxGuests }, (_, i) => i + 1);

const BARCODE_BARS = [3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2];

function TicketBarcode({ className }: { className?: string }) {
  return (
    <div
      className={cn("loft-ticket-barcode text-current", className)}
      aria-hidden
    >
      {BARCODE_BARS.map((w, i) => (
        <span key={i} style={{ width: w }} />
      ))}
    </div>
  );
}

function PerforatedTicket({
  category,
  guests,
  selected,
  disabled,
  onSelect,
  compact,
}: {
  category: LoftCategory;
  guests: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const available = availableLoftsForGuests(category, guests);
  const loftLabel =
    available.length === category.loftNumbers.length
      ? category.loftNumbers.map((n) => String(n).padStart(2, "0")).join(" · ")
      : available.map((n) => String(n).padStart(2, "0")).join(" · ");

  const capacityNote =
    category.id === "atrio" && guests > 3
      ? "Loft 05 no cabe con este grupo"
      : available.length === 1
        ? `Hasta ${category.maxGuestsByLoft[available[0]!] ?? 5} pers.`
        : `Hasta ${category.maxGuests} pers. / loft`;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${category.name}. Desde ${category.priceFromCop.toLocaleString("es-CO")} COP por noche`}
      className={cn(
        "loft-ticket group relative flex w-[min(100%,20.5rem)] shrink-0 snap-center text-left transition duration-300",
        compact ? "min-h-[11.5rem]" : "min-h-[13.5rem]",
        selected &&
          "ring-2 ring-amber-500 ring-offset-2 ring-offset-transparent",
        disabled && "cursor-not-allowed opacity-45 grayscale",
        !disabled && "hover:-translate-y-0.5",
      )}
    >
      <div
        className={cn(
          "relative flex flex-[0_0_74%] flex-col justify-between overflow-hidden",
          compact ? "px-3.5 py-3" : "px-4 py-3.5",
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <Image
            src={category.image}
            alt=""
            fill
            sizes="280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ticket-bg)] via-[var(--ticket-bg)]/90 to-[var(--ticket-bg)]" />
        </div>

        <div className="relative z-[1]">
          <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                className="h-3 w-3 fill-current"
                strokeWidth={0}
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-1.5 font-display text-[1.35rem] font-bold uppercase leading-none tracking-tight text-[var(--ticket-fg)] sm:text-[1.5rem]">
            {category.name}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-[var(--ticket-muted)]">
            {category.tagline}
          </p>
        </div>

        <div className="relative z-[1] mt-3 space-y-2">
          <p className="text-sm font-bold tabular-nums text-[var(--ticket-fg)]">
            Desde {category.priceFromCop.toLocaleString("es-CO")}{" "}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ticket-muted)]">
              COP/noche
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex rounded-full border border-[var(--ticket-line)] bg-[var(--ticket-stub)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ticket-fg)]">
              {guests} {guests === 1 ? "persona" : "personas"}
            </span>
            <span className="text-[10px] font-medium text-[var(--ticket-muted)]">
              {capacityNote}
            </span>
          </div>
          {!disabled ? (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ticket-muted)]">
              Unidades {loftLabel}
            </p>
          ) : (
            <p className="text-[10px] font-semibold text-red-700 dark:text-red-400">
              Sin unidades para {guests} huéspedes
            </p>
          )}
        </div>
      </div>

      <div className="loft-ticket-stub relative flex flex-[0_0_26%] flex-col items-center justify-between py-3">
        <span
          className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ticket-muted)]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {category.stubCode}
        </span>
        <TicketBarcode className="my-2" />
        <span
          className="text-[9px] font-bold tracking-widest text-[var(--ticket-muted)]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          L14
        </span>
      </div>
    </button>
  );
}

/**
 * Tres tiquetes perforados (Vista / Atrio / Cielo) + fechas/huéspedes → /reservar.
 */
export function HeroBookingCard({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [categoryId, setCategoryId] = useState<LoftCategoryId>("vista");
  const [error, setError] = useState("");

  const fitMap = useMemo(() => {
    const map = {} as Record<LoftCategoryId, boolean>;
    for (const cat of LOFT_CATEGORIES) {
      map[cat.id] = categoryFitsGuests(cat, guests);
    }
    return map;
  }, [guests]);

  const selectedFits = fitMap[categoryId];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!checkIn || !checkOut) {
      setError("Elige entrada y salida en el calendario.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("La salida debe ser después de la entrada.");
      return;
    }
    if (!selectedFits) {
      setError("Esa categoría no tiene lofts para esa cantidad de huéspedes.");
      return;
    }
    trackBeginCheckout({ guests });
    saveStayDraft({
      checkIn,
      checkOut,
      guests,
      categoryId,
      step: 1,
    });
    router.push("/reservar");
  };

  return (
    <div className={cn("relative z-20 w-full overflow-visible", className)}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div
          className={cn(
            "rounded-2xl border border-white/20 bg-black/45 p-3 shadow-xl backdrop-blur-md",
            "dark:border-white/15",
          )}
        >
          <StayDateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(inDate, outDate) => {
              setCheckIn(inDate);
              setCheckOut(outDate);
              setError("");
            }}
            compact
            required
          />
          <label className="mt-2.5 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> Huéspedes
            </span>
            <select
              value={guests}
              onChange={(e) => {
                const next = Number(e.target.value);
                setGuests(next);
                setError("");
                if (!categoryFitsGuests(getCategory(categoryId), next)) {
                  const fallback = LOFT_CATEGORIES.find((c) =>
                    categoryFitsGuests(c, next),
                  );
                  if (fallback) setCategoryId(fallback.id);
                }
              }}
              className="rounded-xl border border-white/25 bg-white/95 px-2.5 py-2 text-sm font-semibold text-zinc-900"
            >
              {GUEST_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "huésped" : "huéspedes"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
            Elige tu tiquete
          </p>
          <div
            className={cn(
              "-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1 snap-x snap-mandatory",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
            role="listbox"
            aria-label="Categorías de loft"
          >
            {LOFT_CATEGORIES.map((cat) => (
              <PerforatedTicket
                key={cat.id}
                category={cat}
                guests={guests}
                selected={categoryId === cat.id}
                disabled={!fitMap[cat.id]}
                compact={compact}
                onSelect={() => {
                  if (!fitMap[cat.id]) return;
                  setCategoryId(cat.id);
                  setError("");
                }}
              />
            ))}
          </div>
        </div>

        {error ? (
          <p className="text-xs font-medium text-amber-200" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-full bg-amber-500 py-3 text-xs font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-amber-400"
        >
          Reservar {getCategory(categoryId).name}
        </button>
      </form>
    </div>
  );
}

function getCategory(id: LoftCategoryId): LoftCategory {
  return LOFT_CATEGORIES.find((c) => c.id === id)!;
}
