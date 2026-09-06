"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Wifi,
  Wind,
  ChefHat,
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
  { icon: Users, label: `Hasta ${site.maxGuestsPerLoft}` },
] as const;

const GUEST_OPTIONS = Array.from(
  { length: Math.min(site.maxGuests, 20) },
  (_, i) => i + 1,
);

/**
 * Card de reserva del hero: fotos clave + fechas (calendario) + huéspedes (selector)
 * y CTA que abre la página exclusiva /reservar.
 */
export function HeroBookingCard({
  className,
  compact = false,
}: {
  className?: string;
  /** Más compacta en escritorio para caber sobre el título. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % LOFT_SLIDES.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + LOFT_SLIDES.length) % LOFT_SLIDES.length);
  };

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
        "w-full overflow-hidden rounded-3xl border border-white/25 bg-white shadow-2xl",
        "dark:border-white/15 dark:bg-zinc-950",
        className,
      )}
    >
      <div
        className={cn(
          "relative bg-zinc-200 dark:bg-zinc-800",
          compact ? "aspect-[16/9]" : "aspect-[16/10]",
        )}
      >
        <Image
          src={slide.src}
          alt={slide.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 440px"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/90">
            {slide.label} · Loft Miraflores
          </p>
        </div>
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Foto siguiente"
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {LOFT_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Ver ${s.label}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
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
            <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
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
