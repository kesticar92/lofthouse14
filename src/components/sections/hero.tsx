"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { WaLink } from "@/components/layout/wa-link";
import Image from "next/image";

/** Insignia azul estilo Meta Verificado (check blanco sobre círculo azul). */
function MetaVerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      aria-hidden
      role="img"
    >
      <title>Verificado</title>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M10.1 16.6 6.4 12.9l1.4-1.4 2.3 2.3 5.1-5.1 1.4 1.4z"
      />
    </svg>
  );
}

/** Mismas rutas en /public/hero — comprimidos sin audio (~3–6 MB c/u). */
export const HERO_VIDEO_SLIDES = [
  {
    id: "lofthouse",
    src: "/hero/slide-01.mp4",
    label: "Fachada Lofthouse 14 en Miraflores, Cali",
  },
  {
    id: "experiencia-1",
    src: "/hero/slide-02.mp4",
    label: "Lofts en Cali cerca del Parque del Perro",
  },
  {
    id: "experiencia-2",
    src: "/hero/slide-03.mp4",
    label: "Estadía en apartaestudio Miraflores",
  },
  {
    id: "experiencia-3",
    src: "/hero/slide-04.mp4",
    label: "Entorno de Miraflores y San Fernando",
  },
] as const;

/** Miniaturas del hero: solo cocina equipada. */
const HERO_PHOTOS = [
  {
    src: "/gallery/cocina_1_resultado.webp",
    alt: "Cocina equipada en loft Lofthouse 14 — Miraflores, Cali",
  },
  {
    src: "/gallery/cocina_2.webp",
    alt: "Cocina moderna con mesón en loft Cali Parque del Perro",
  },
  {
    src: "/gallery/cocina_3.webp",
    alt: "Cocina completa con nevera y estufa en Lofthouse 14",
  },
  {
    src: "/gallery/cocina_4.webp",
    alt: "Detalle de cocina equipada en apartaestudio Miraflores",
  },
] as const;

function HeroVideoSlide({
  src,
  label,
  isActive,
  onEnded,
  slideRef,
}: {
  src: string;
  label: string;
  isActive: boolean;
  onEnded?: () => void;
  slideRef?: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive, src]);

  return (
    <div
      ref={slideRef}
      className="relative h-full w-full shrink-0 grow-0 basis-full snap-center snap-always overflow-hidden"
      aria-label={label}
    >
      <video
        ref={ref}
        src={src}
        muted
        playsInline
        preload={isActive ? "auto" : "metadata"}
        onEnded={() => {
          if (isActive) onEnded?.();
        }}
        className="h-full w-full object-cover object-center"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/35" />
    </div>
  );
}

const arrowClass =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white shadow-lg backdrop-blur-md transition hover:bg-black/55 active:scale-95 sm:h-12 sm:w-12";

export function Hero({
  ratingValue,
  reviewCount,
}: {
  ratingValue: number;
  reviewCount: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    if (slideWidth <= 0) return;
    const index = Math.round(el.scrollLeft / slideWidth);
    setActiveIndex(Math.min(HERO_VIDEO_SLIDES.length - 1, Math.max(0, index)));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateActiveFromScroll();
    el.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll);
    return () => {
      el.removeEventListener("scroll", updateActiveFromScroll);
      window.removeEventListener("resize", updateActiveFromScroll);
    };
  }, [updateActiveFromScroll]);

  const goToSlide = useCallback((index: number) => {
    const el = scrollerRef.current;
    const clamped = Math.min(HERO_VIDEO_SLIDES.length - 1, Math.max(0, index));
    if (el) {
      const slideWidth = el.clientWidth;
      el.scrollTo({ left: clamped * slideWidth, behavior: "smooth" });
    } else {
      slideRefs.current[clamped]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }
    setActiveIndex(clamped);
  }, []);

  const goToNextSlide = useCallback(() => {
    goToSlide((activeIndex + 1) % HERO_VIDEO_SLIDES.length);
  }, [activeIndex, goToSlide]);

  const goToPrevSlide = useCallback(() => {
    goToSlide(
      (activeIndex - 1 + HERO_VIDEO_SLIDES.length) % HERO_VIDEO_SLIDES.length,
    );
  }, [activeIndex, goToSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
    touchStartY.current = e.touches[0]?.clientY ?? 0;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0]?.clientX ?? 0;
    const endY = e.changedTouches[0]?.clientY ?? 0;
    const dx = endX - touchStartX.current;
    const dy = endY - touchStartY.current;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goToNextSlide();
    else goToPrevSlide();
  };

  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 z-0 touch-pan-x">
        <div
          ref={scrollerRef}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carrusel"
          aria-label="Fotos y videos de Lofthouse 14 en Miraflores, Cali"
        >
          {HERO_VIDEO_SLIDES.map((slide, index) => (
            <HeroVideoSlide
              key={slide.id}
              src={slide.src}
              label={slide.label}
              isActive={index === activeIndex}
              onEnded={goToNextSlide}
              slideRef={(el) => {
                slideRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Video anterior"
        onClick={goToPrevSlide}
        className={cn(
          arrowClass,
          "absolute left-3 top-[38%] z-20 -translate-y-1/2 sm:left-5",
        )}
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Siguiente video"
        onClick={goToNextSlide}
        className={cn(
          arrowClass,
          "absolute right-3 top-[38%] z-20 -translate-y-1/2 max-sm:right-[4.5rem] sm:right-5",
        )}
      >
        <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* pb extra: deja hueco para el buscador sticky que se solapa desde debajo del hero */}
      {/* pb amplio: el StickyBookingBar se solapa aquí desde debajo del hero */}
      <div className="pointer-events-none relative z-10 w-full p-6 pb-44 max-sm:pr-[5.75rem] sm:pb-36 md:p-16 md:pb-32">
        <div className="max-w-3xl text-left">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
            Miraflores · Parque del Perro
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
            Quédate en Cali. Vívela a tu manera.
          </h1>
          <p className="mt-4 max-w-[calc(100vw-5.75rem-3rem)] text-left text-lg leading-snug text-gray-200 drop-shadow-md sm:max-w-none md:text-xl">
            Lofts privados y equipados para escapadas, vacaciones, viajes de
            negocios y estadías más largas. Tu espacio, tu ritmo y todo Cali a
            tu alcance.
          </p>
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
            <span>
              {ratingValue}/5 · {reviewCount} reseñas verificadas en Google,
              Booking y Airbnb
            </span>
            <MetaVerifiedBadge className="h-4 w-4" />
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {HERO_PHOTOS.map((photo) => (
              <Link
                key={photo.src}
                href="/galeria"
                className="pointer-events-auto relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-white/30"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link
              href="/reservas"
              className="pointer-events-auto inline-flex rounded-full border border-transparent bg-white px-8 py-4 text-sm font-bold uppercase tracking-wide text-zinc-900 shadow-lg transition hover:bg-zinc-100"
            >
              Ver disponibilidad
            </Link>
            <WaLink
              placement="hero"
              className="pointer-events-auto inline-flex rounded-full border border-white/40 bg-black/35 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white backdrop-blur hover:bg-black/55"
            >
              Hablar por WhatsApp
            </WaLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
