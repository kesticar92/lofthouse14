"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryPhoto } from "@/data/gallery-photos";
import { cn } from "@/lib/cn";

type Props = {
  photos: readonly GalleryPhoto[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
};

export function ImmersiveGallery({
  photos,
  index,
  onClose,
  onChange,
}: Props) {
  const open = index !== null;
  const photo = index !== null ? photos[index] : null;
  const touchX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 40, damping: 18, mass: 0.4 });
  const parallaxX = useTransform(sx, [-0.5, 0.5], ["-1.6%", "1.6%"]);
  const parallaxY = useTransform(sy, [-0.5, 0.5], ["-1.2%", "1.2%"]);

  const go = useCallback(
    (next: number) => {
      if (!photos.length) return;
      const wrapped = (next + photos.length) % photos.length;
      onChange(wrapped);
      mx.set(0);
      my.set(0);
    },
    [photos.length, onChange, mx, my],
  );

  const goPrev = useCallback(() => {
    if (index === null) return;
    go(index - 1);
  }, [go, index]);

  const goNext = useCallback(() => {
    if (index === null) return;
    go(index + 1);
  }, [go, index]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, goPrev, goNext]);

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <AnimatePresence>
      {open && photo ? (
        <motion.div
          key="immersive-root"
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Galería a pantalla completa"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

          <header className="relative z-20 flex items-center justify-between px-4 py-4 text-white/90 sm:px-8">
            <p className="font-display text-xs tracking-[0.28em] uppercase text-white/70">
              LOFTHOUSE 14
            </p>
            <p className="tabular-nums text-sm tracking-widest text-white/60">
              {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(photos.length).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/15"
              aria-label="Cerrar galería"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </header>

          <div
            className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-10"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerDown={(e) => {
              touchX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (touchX.current == null) return;
              const dx = e.clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) < 56) return;
              if (dx > 0) goPrev();
              else goNext();
            }}
          >
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:flex md:left-6"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:flex md:right-6"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={photo.src}
                className="relative h-[min(78vh,820px)] w-full max-w-6xl overflow-hidden"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 1.04, filter: "blur(6px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.98, filter: "blur(4px)" }
                }
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="absolute inset-[-4%]"
                  style={
                    reduceMotion
                      ? undefined
                      : { x: parallaxX, y: parallaxY, scale: 1.06 }
                  }
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain select-none"
                    draggable={false}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="relative z-20 px-4 pb-5 pt-2 sm:px-8">
            <p className="mb-3 text-center text-sm text-white/65">{photo.alt}</p>
            <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {photos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => onChange(i)}
                  className={cn(
                    "relative h-14 w-10 shrink-0 overflow-hidden rounded-sm ring-offset-2 ring-offset-black transition sm:h-16 sm:w-12",
                    i === index
                      ? "ring-2 ring-white"
                      : "opacity-45 hover:opacity-90",
                  )}
                  aria-label={`Ir a foto ${i + 1}`}
                  aria-current={i === index}
                >
                  <Image
                    src={p.src}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </footer>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
