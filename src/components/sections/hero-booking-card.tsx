"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bath,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Ticket,
  Tv,
  Users,
  Wifi,
  Wind,
} from "lucide-react";
import { trackBeginCheckout } from "@/lib/analytics";
import { saveStayDraft } from "@/lib/stay-draft";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";

const LOFT_SLIDES = [
  {
    src: "/gallery/loft-habitacion-miraflores-cali.webp",
    alt: "Cama y entrepiso de loft en Miraflores Cali",
    label: "Habitación",
  },
  {
    src: "/gallery/loft-cocina-equipada-miraflores-cali.webp",
    alt: "Cocina equipada de loft Lofthouse 14",
    label: "Cocina",
  },
  {
    src: "/gallery/immersive/18-sala_cocina_escalera.webp",
    alt: "Sala, cocina y escalera del loft",
    label: "Sala",
  },
  {
    src: "/gallery/loft-dormitorio-entrepiso-miraflores-cali.webp",
    alt: "Dormitorio en entrepiso del loft",
    label: "Entrepiso",
  },
] as const;

const HIGHLIGHTS = [
  { icon: ChefHat, label: "Cocina" },
  { icon: Wifi, label: "WiFi" },
  { icon: Wind, label: "A/C" },
  { icon: Tv, label: "Smart TV" },
  { icon: Bath, label: "Baño" },
] as const;

const GUEST_OPTIONS = Array.from({ length: site.maxGuests }, (_, i) => i + 1);

/**
 * Card de reserva del hero: carrusel de fotos + fechas/huéspedes → /reservar.
 * Orificios laterales + línea intermitente bajo las fotos (tipo tiquete).
 */
export function HeroBookingCard({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);

  const goTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    const next =
      ((i % LOFT_SLIDES.length) + LOFT_SLIDES.length) % LOFT_SLIDES.length;
    setIndex(next);
    if (el) {
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      setAutoPlay(false);
      goTo(index + dir);
    },
    [goTo, index],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const i = Math.round(el.scrollLeft / w);
      setIndex(Math.min(LOFT_SLIDES.length - 1, Math.max(0, i)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setInterval(() => {
      goTo(index + 1);
    }, 4200);
    return () => window.clearInterval(id);
  }, [autoPlay, goTo, index]);

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
    trackBeginCheckout({ guests });
    saveStayDraft({
      checkIn,
      checkOut,
      guests,
      step: 1,
    });
    router.push("/reservar");
  };

  const slide = LOFT_SLIDES[index]!;

  return (
    <div
      className={cn(
        "relative z-20 w-full overflow-visible",
        "rounded-[1.35rem] border border-zinc-300/90 bg-white shadow-2xl",
        "dark:border-zinc-600 dark:bg-zinc-950",
        className,
      )}
    >
      {/* Stub superior */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          <Ticket className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          Tiquete loft
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {index + 1}/{LOFT_SLIDES.length} · desliza
        </span>
      </div>

      {/* Carrusel horizontal */}
      <div
        className={cn(
          "relative bg-zinc-200 dark:bg-zinc-800",
          compact ? "aspect-[16/9]" : "aspect-[16/10]",
        )}
        onPointerDown={() => setAutoPlay(false)}
      >
        <div
          ref={scrollerRef}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carrusel"
          aria-label="Fotos del loft — desliza horizontalmente"
        >
          {LOFT_SLIDES.map((item, i) => (
            <div
              key={item.src}
              className="relative h-full w-full shrink-0 grow-0 basis-full snap-center snap-always"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 440px"
                className="object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/95">
            {slide.label} · Loft Miraflores
          </p>
        </div>

        <button
          type="button"
          aria-label="Foto anterior"
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Foto siguiente"
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {LOFT_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Ver ${s.label}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => {
                setAutoPlay(false);
                goTo(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      </div>

      {/*
        Perforación: orificios a cada lado + línea intermitente bajo las fotos.
        Los círculos “recortan” la card (mismo color del hero oscuro detrás).
      */}
      <div
        aria-hidden
        className="booking-card-perforation relative z-30 flex h-0 items-center"
      >
        <span className="booking-card-hole absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full" />
        <span className="mx-3 block h-0 w-full border-t border-dashed border-zinc-300 dark:border-zinc-600" />
        <span className="booking-card-hole absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full" />
      </div>

      <div className={cn("space-y-3", compact ? "p-3" : "p-3.5")}>
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tu loft en el Parque del Perro
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            Desde {site.priceFromCop.toLocaleString("es-CO")} COP/noche · check-in
            autónomo
          </p>
        </div>

        <ul className="flex flex-wrap gap-2">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Icon className="h-3 w-3" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <form onSubmit={onSubmit} className="space-y-2.5">
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

          <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> Huéspedes
            </span>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="rounded-xl border border-zinc-300 bg-white px-2.5 py-2 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {GUEST_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "huésped" : "huéspedes"}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p
              className="text-xs font-medium text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
          >
            Reservar
          </button>
        </form>
      </div>
    </div>
  );
}
