"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import { mergeStayDraft, readStayDraft } from "@/lib/stay-draft";
import { cn } from "@/lib/cn";
import {
  LOFT_CATEGORIES,
  type LoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";

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
  compact,
  onReserve,
}: {
  category: LoftCategory;
  compact?: boolean;
  onReserve: (id: LoftCategoryId) => void;
}) {
  const loftLabel = category.loftNumbers
    .map((n) => String(n).padStart(2, "0"))
    .join(" · ");

  const capacityNote =
    category.id === "atrio"
      ? `Hasta ${category.maxGuests} pers. · Loft 05 máx. 3`
      : `Hasta ${category.maxGuests} pers. / loft`;

  return (
    <article
      className={cn(
        "loft-ticket group relative flex w-[min(100%,20.5rem)] shrink-0 snap-center text-left transition duration-300",
        compact ? "min-h-[13rem]" : "min-h-[14.5rem]",
        "hover:-translate-y-0.5",
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
          <p className="text-[10px] font-medium text-[var(--ticket-muted)]">
            {capacityNote}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ticket-muted)]">
            Unidades {loftLabel}
          </p>
          <button
            type="button"
            onClick={() => onReserve(category.id)}
            aria-label={`Reservar ${category.name}`}
            className="mt-1 w-full rounded-full bg-zinc-900 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
          >
            Reservar
          </button>
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
    </article>
  );
}

/**
 * Tres tiquetes perforados (Vista / Atrio / Cielo): info + CTA Reservar.
 * Fechas y huéspedes viven en el banner superior.
 */
export function HeroBookingCard({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();

  const onReserve = (categoryId: LoftCategoryId) => {
    const draft = readStayDraft();
    const guests = draft?.guests && draft.guests > 0 ? draft.guests : 2;
    trackBeginCheckout({ guests });
    mergeStayDraft({
      categoryId,
      guests,
      // Si ya hay fechas/huéspedes en el banner, el wizard las aplica y salta esos pasos.
      step: 0,
    });
    router.push("/reservar");
  };

  return (
    <div className={cn("relative z-20 w-full overflow-visible", className)}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80">
        Elige tu loft
      </p>
      <div
        className={cn(
          "-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1 snap-x snap-mandatory",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        aria-label="Categorías de loft"
      >
        {LOFT_CATEGORIES.map((cat) => (
          <PerforatedTicket
            key={cat.id}
            category={cat}
            compact={compact}
            onReserve={onReserve}
          />
        ))}
      </div>
    </div>
  );
}
