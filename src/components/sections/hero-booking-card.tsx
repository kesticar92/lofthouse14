"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import { mergeStayDraft, readStayDraft } from "@/lib/stay-draft";
import { cn } from "@/lib/cn";
import {
  LOFT_CATEGORIES,
  type LoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";

const BARCODE_BARS = [
  2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 1, 2, 3, 1, 1, 2,
];

function TicketBarcode({ className }: { className?: string }) {
  return (
    <div
      className={cn("loft-boarding-barcode text-current", className)}
      aria-hidden
    >
      {BARCODE_BARS.map((w, i) => (
        <span key={i} style={{ width: w }} />
      ))}
    </div>
  );
}

function formatPrice(n: number) {
  return n.toLocaleString("es-CO");
}

function BoardingTicket({
  category,
  index,
  onReserve,
}: {
  category: LoftCategory;
  index: number;
  onReserve: (id: LoftCategoryId) => void;
}) {
  const ticketNo = String(index + 1).padStart(3, "0");
  const capacityNote =
    category.id === "atrio"
      ? `Hasta ${category.maxGuests} · Loft 05 máx. 3`
      : `Hasta ${category.maxGuests} pers. / loft`;

  return (
    <article
      className={cn(
        "loft-boarding group relative flex w-full max-w-[17.5rem] shrink-0 flex-col text-left transition duration-300",
        `loft-boarding--${category.theme}`,
        "hover:-translate-y-1",
      )}
    >
      <div className="loft-boarding-inner relative flex flex-1 flex-col px-3.5 pb-3 pt-3 sm:px-4">
        {/* Header */}
        <header className="flex items-start justify-between gap-2">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--ticket-muted)] sm:text-[9px]">
            Ticket de reserva #{ticketNo}
          </p>
          <div className="flex flex-col items-center leading-none">
            <span
              className="text-[10px] font-black tracking-tight text-[var(--ticket-accent)]"
              aria-hidden
            >
              ⌂
            </span>
            <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-[var(--ticket-fg)]">
              Lofthouse 14
            </span>
          </div>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--ticket-line)] text-[var(--ticket-accent)]"
            aria-hidden
          >
            <Plane className="h-3 w-3" strokeWidth={2} />
          </span>
        </header>

        <h3 className="mt-2.5 font-display text-[1.35rem] font-bold uppercase leading-none tracking-tight text-[var(--ticket-fg)] sm:text-[1.5rem]">
          {category.name}
        </h3>

        {/* Illustration */}
        <div className="relative mt-2.5 aspect-[16/10] w-full overflow-hidden rounded-sm border border-[var(--ticket-line)] bg-[var(--ticket-stub)]">
          <Image
            src={category.image}
            alt={category.imageAlt}
            fill
            sizes="280px"
            className="object-cover"
          />
        </div>

        <p className="loft-boarding-vista mt-0 border border-t-0 border-[var(--ticket-line)] bg-[var(--ticket-vista-bg)] px-2 py-1 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ticket-vista-fg)]">
          Vista: {category.vistaLabel}
        </p>

        {/* Amenities + price seal */}
        <div className="relative mt-3 flex min-h-[5.5rem] gap-2 pr-1">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ticket-fg)]">
              Amenidades comunes
            </p>
            <p className="text-[10px] leading-snug text-[var(--ticket-muted)]">
              <span className="font-bold text-[var(--ticket-fg)]">Camas:</span>{" "}
              {category.bedsLabel}
            </p>
            <p className="text-[10px] leading-snug text-[var(--ticket-muted)]">
              <span className="font-bold text-[var(--ticket-fg)]">
                Comodidades:
              </span>{" "}
              {category.amenities.join(", ")}
            </p>
            <p className="text-[9px] text-[var(--ticket-muted)]">{capacityNote}</p>
          </div>

          <div
            className="loft-boarding-seal absolute -right-0.5 top-0 flex h-[4.6rem] w-[4.6rem] shrink-0 flex-col items-center justify-center rounded-full text-center shadow-md"
            aria-label={`Desde ${formatPrice(category.priceFromCop)} COP`}
          >
            <span className="text-[8px] font-bold uppercase tracking-wider opacity-90">
              Desde
            </span>
            <span className="text-[11px] font-black tabular-nums leading-tight">
              {formatPrice(category.priceFromCop)}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wide">
              COP
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onReserve(category.id)}
          aria-label={`Reservar ${category.name}`}
          className="loft-boarding-cta mt-3 w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition"
        >
          Reservar
        </button>

        <p className="mt-2 text-center text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--ticket-muted)]">
          Boleto de selección de habitación
        </p>
      </div>

      {/* Tear-off stub */}
      <div className="loft-boarding-stub relative mx-3.5 border-t border-dashed border-[var(--ticket-line)] px-0 pb-3 pt-2.5 sm:mx-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--ticket-muted)]">
            {category.stubLabel}
          </span>
          <span className="h-5 flex-1 rounded-sm border border-[var(--ticket-line)] bg-[var(--ticket-stub-field)]" />
        </div>
        <TicketBarcode />
      </div>
    </article>
  );
}

/**
 * Tres tickets tipo boarding pass (Vista / Atrio / Cielo): info + CTA Reservar.
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
      <p
        className={cn(
          "mb-2 text-[10px] font-bold uppercase tracking-[0.16em]",
          compact ? "text-white/80" : "text-white/85",
        )}
      >
        Elige tu loft
      </p>
      {/* Desktop/tablet: las 3 visibles. Móvil: scroll horizontal suave. */}
      <div
        className={cn(
          "flex gap-3 pb-1 pt-1",
          "max-md:-mx-1 max-md:overflow-x-auto max-md:px-1 max-md:snap-x max-md:snap-mandatory",
          "max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden",
          "md:grid md:grid-cols-3 md:gap-3 md:overflow-visible",
          "lg:gap-4",
        )}
        aria-label="Categorías de loft"
      >
        {LOFT_CATEGORIES.map((cat, index) => (
          <div
            key={cat.id}
            className="flex justify-center max-md:w-[min(100%,17.5rem)] max-md:shrink-0 max-md:snap-center md:w-full"
          >
            <BoardingTicket
              category={cat}
              index={index}
              onReserve={onReserve}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
