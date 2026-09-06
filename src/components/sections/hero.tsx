"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { HeroBookingCard } from "@/components/sections/hero-booking-card";

/** Mismas rutas en /public/hero — comprimidos sin audio (~3–6 MB c/u). */
export const HERO_VIDEO_SLIDES = [
  { id: "lofthouse", src: "/hero/slide-01.mp4", label: "LOFTHOUSE 14" },
  { id: "experiencia-1", src: "/hero/slide-02.mp4", label: "Cali" },
  { id: "experiencia-2", src: "/hero/slide-03.mp4", label: "Estadía" },
  { id: "experiencia-3", src: "/hero/slide-04.mp4", label: "Entorno" },
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
        preload={isActive ? "auto" : "none"}
        poster="/gallery/immersive/09-fachada_diurna.webp"
        onEnded={() => {
          if (isActive) onEnded?.();
        }}
        className="h-full w-full object-cover object-center"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />
    </div>
  );
}

const arrowClass =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white shadow-lg backdrop-blur-md transition hover:bg-black/55 active:scale-95 sm:h-12 sm:w-12";

export function Hero() {
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
    setActiveIndex(
      Math.min(HERO_VIDEO_SLIDES.length - 1, Math.max(0, index)),
    );
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
    const clamped = Math.min(
      HERO_VIDEO_SLIDES.length - 1,
      Math.max(0, index),
    );
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
      (activeIndex - 1 + HERO_VIDEO_SLIDES.length) %
        HERO_VIDEO_SLIDES.length,
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
    <>
      {/* —— Móvil: reserva desde el hero —— */}
      <section
        id="inicio"
        className="relative md:hidden"
        aria-label="Inicio y cotización rápida"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(0,0,0,.55), rgba(15,15,15,.88)), url(/gallery/immersive/09-fachada_diurna.webp)",
          }}
          aria-hidden
        />
        <div className="relative z-10 px-4 pb-8 pt-20">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
            <span aria-hidden>★</span> 4.8 · 388 reseñas
          </p>
          <h1 className="font-display text-[1.65rem] font-bold uppercase leading-tight text-white drop-shadow-md">
            Lofts en Cali Miraflores — Parque del Perro
          </h1>
          <p className="mt-2 max-w-md text-sm leading-snug text-white/85">
            Elige fechas aquí y pasa directo a cotizar. Cocina, WiFi y check-in
            autónomo.
          </p>
          <div className="mt-5">
            <HeroBookingCard />
          </div>
        </div>
      </section>

      {/* —— Desktop: video hero —— */}
      <section
        className="relative hidden h-[100svh] min-h-[560px] w-full flex-col justify-end overflow-hidden md:flex"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Inicio"
      >
        <div className="absolute inset-0 z-0 touch-pan-x">
          <div
            ref={scrollerRef}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-roledescription="carrusel"
            aria-label="Publicidad LOFTHOUSE 14"
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
          className={cn(arrowClass, "absolute left-5 top-1/2 z-20 -translate-y-1/2")}
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Siguiente video"
          onClick={goToNextSlide}
          className={cn(arrowClass, "absolute right-5 top-1/2 z-20 -translate-y-1/2")}
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-32 z-20 flex justify-center gap-2">
          {HERO_VIDEO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ver video ${index + 1}: ${slide.label}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => goToSlide(index)}
              className={cn(
                "pointer-events-auto h-2 rounded-full transition-all",
                index === activeIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
        </div>

        <div className="pointer-events-none relative z-10 w-full p-16 pb-20">
          <div className="max-w-3xl text-left">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <span aria-hidden>★</span> 4.8 · 388 reseñas verificadas
            </p>
            <h1 className="font-display text-5xl font-bold uppercase leading-tight text-white drop-shadow-md lg:text-6xl">
              Lofts en Cali Miraflores — Tu base en el Parque del Perro
            </h1>
            <p className="mt-4 text-xl leading-snug text-gray-200 drop-shadow-md">
              Cocina, WiFi y check-in autónomo. Desde $80.000/noche. Reserva
              directo con Lofthouse 14.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="#reservas"
                className="pointer-events-auto inline-flex rounded-full border border-transparent bg-white px-8 py-4 text-sm font-bold uppercase tracking-wide text-zinc-900 shadow-lg transition hover:bg-zinc-100 dark:border-white/15 dark:bg-zinc-900/90 dark:text-[#f2f0eb] dark:shadow-black/40 dark:backdrop-blur-md dark:hover:bg-zinc-800"
              >
                Configurar mi estadía
              </Link>
              <Link
                href="/lofts"
                className="pointer-events-auto inline-flex rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Ver lofts
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
