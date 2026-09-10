"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bath,
  BedDouble,
  CookingPot,
  KeyRound,
  Plane,
  Tv,
  Wifi,
  Wind,
} from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import {
  mergeStayDraft,
  readStayDraft,
  stayDraftToQuery,
} from "@/lib/stay-draft";
import { cn } from "@/lib/cn";
import {
  LOFT_CATEGORIES,
  type LoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Aire acondicionado": Wind,
  "Cocina Equipada": CookingPot,
  "Smart TV con ROKU": Tv,
  Baño: Bath,
  WiFi: Wifi,
  "Smart Entry": KeyRound,
};

/** Ciclo suave tipo hero videos (~5.5s por foto). */
const CAROUSEL_MS = 5500;

function formatPrice(n: number) {
  return n.toLocaleString("es-CO");
}

function TicketPhotoCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const slides = images.length > 0 ? images : ["/gallery/sala_1.webp"];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, CAROUSEL_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative mt-2.5 aspect-[16/10] w-full overflow-hidden rounded-sm border border-[var(--ticket-line)] bg-[var(--ticket-stub)]">
      {slides.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          fill
          sizes="280px"
          className={cn(
            "object-cover transition-opacity duration-[1200ms] ease-in-out",
            i === active ? "opacity-100" : "opacity-0",
          )}
          priority={i === 0}
          aria-hidden={i !== active}
        />
      ))}
      {slides.length > 1 ? (
        <div
          className="pointer-events-none absolute bottom-1.5 left-1/2 z-[1] flex -translate-x-1/2 gap-1"
          aria-hidden
        >
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === active
                  ? "w-3 bg-white/90"
                  : "w-1 bg-white/45",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
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
      <div className="loft-boarding-inner relative flex flex-1 flex-col px-3.5 pb-3.5 pt-3 sm:px-4">
        {/* Header — solo logo imagen, sin texto LOFTHOUSE 14 */}
        <header className="flex items-start justify-between gap-2">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--ticket-muted)] sm:text-[9px]">
            Ticket de reserva #{ticketNo}
          </p>
          <Image
            src="/logo-lofthouse.png"
            alt="LOFTHOUSE"
            width={72}
            height={28}
            className="h-7 w-auto max-w-[4.5rem] object-contain object-center"
          />
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

        <TicketPhotoCarousel
          images={category.images?.length ? category.images : [category.image]}
          alt={category.imageAlt}
        />

        <p className="loft-boarding-vista mt-0 border border-t-0 border-[var(--ticket-line)] bg-[var(--ticket-vista-bg)] px-2 py-1 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ticket-vista-fg)]">
          Vista: {category.vistaLabel}
        </p>

        <div className="mt-3 space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ticket-fg)]">
            Amenidades comunes
          </p>
          <p className="flex items-start gap-1.5 text-[10px] leading-snug text-[var(--ticket-muted)]">
            <BedDouble
              className="mt-0.5 h-3 w-3 shrink-0 text-[var(--ticket-accent)]"
              strokeWidth={2}
              aria-hidden
            />
            <span>
              <span className="font-bold text-[var(--ticket-fg)]">Camas:</span>{" "}
              {category.bedsLabel}
            </span>
          </p>
          <ul className="grid gap-1">
            {category.amenities.map((amenity) => {
              const Icon = AMENITY_ICONS[amenity];
              return (
                <li
                  key={amenity}
                  className="flex items-center gap-1.5 text-[10px] leading-snug text-[var(--ticket-muted)]"
                >
                  {Icon ? (
                    <Icon
                      className="h-3 w-3 shrink-0 text-[var(--ticket-accent)]"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full bg-[var(--ticket-accent)]/30"
                      aria-hidden
                    />
                  )}
                  <span className="font-medium text-[var(--ticket-fg)]">
                    {amenity}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-[9px] text-[var(--ticket-muted)]">{capacityNote}</p>
        </div>

        <div
          className="loft-boarding-seal mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-center"
          aria-label={`Desde ${formatPrice(category.priceFromCop)} COP`}
        >
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-90">
            Desde
          </span>
          <span className="text-[13px] font-black tabular-nums leading-none">
            {formatPrice(category.priceFromCop)}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-wide">
            COP / noche
          </span>
        </div>

        <button
          type="button"
          onClick={() => onReserve(category.id)}
          aria-label={`Reservar ${category.name}`}
          className="loft-boarding-cta mt-3 w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition"
        >
          Reservar
        </button>
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
  const [categories, setCategories] = useState<LoftCategory[]>(LOFT_CATEGORIES);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/public/lofts-marketing");
        if (!res.ok) return;
        const json = (await res.json()) as {
          categories?: Array<
            Pick<
              LoftCategory,
              | "id"
              | "amenities"
              | "images"
              | "image"
              | "imageAlt"
              | "name"
              | "shortLabel"
              | "tagline"
              | "vistaLabel"
              | "bedsLabel"
              | "priceFromCop"
              | "maxGuests"
              | "theme"
            >
          >;
        };
        if (cancelled || !json.categories?.length) return;
        setCategories((prev) =>
          prev.map((base) => {
            const remote = json.categories!.find((c) => c.id === base.id);
            if (!remote) return base;
            return {
              ...base,
              amenities: remote.amenities?.length
                ? remote.amenities
                : base.amenities,
              images: remote.images?.length ? remote.images : base.images,
              image: remote.image || base.image,
              imageAlt: remote.imageAlt || base.imageAlt,
              priceFromCop: remote.priceFromCop ?? base.priceFromCop,
            };
          }),
        );
      } catch {
        /* seed local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onReserve = (categoryId: LoftCategoryId) => {
    const draft = readStayDraft();
    const guests = draft?.guests && draft.guests > 0 ? draft.guests : undefined;
    trackBeginCheckout({ guests: guests ?? 2 });
    const hasDates = Boolean(
      draft?.checkIn &&
        draft?.checkOut &&
        draft.checkOut > draft.checkIn,
    );
    const hasGuests = Boolean(guests && guests > 0);
    const stayReady = hasDates && hasGuests;
    // Card: categoría fija → fechas (o extras si ya hay estadía).
    const next = {
      categoryId,
      guests: guests ?? draft?.guests,
      from: "card" as const,
      step: stayReady ? 4 : hasDates ? 2 : 1,
    };
    mergeStayDraft(next);
    const q = stayDraftToQuery({ ...readStayDraft(), ...next });
    router.push(q ? `/reservar?${q}` : "/reservar");
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
        {categories.map((cat, index) => (
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
