"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  LOFT_CATEGORIES,
  getLoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";

const ROTATE_MS = 900;

type AvailabilityCheckingPanelProps = {
  categoryId: LoftCategoryId | null;
  className?: string;
  /** Compacto (inline en resumen) vs overlay. */
  variant?: "card" | "overlay";
};

/**
 * Carrusel de fotos del loft elegido mientras se consulta iCal / disponibilidad.
 */
export function AvailabilityCheckingPanel({
  categoryId,
  className,
  variant = "card",
}: AvailabilityCheckingPanelProps) {
  const slides = useMemo(() => {
    if (categoryId) {
      const cat = getLoftCategory(categoryId);
      return cat.images.length > 0 ? cat.images : [cat.image];
    }
    return LOFT_CATEGORIES.flatMap((c) => c.images.slice(0, 2));
  }, [categoryId]);

  const [active, setActive] = useState(0);
  const label = categoryId
    ? getLoftCategory(categoryId).name
    : "tus alojamientos";

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`Consultando disponibilidad de ${label}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        "overflow-hidden rounded-2xl border border-amber-300/80 bg-amber-50 text-left shadow-lg dark:border-amber-700/60 dark:bg-amber-950/90",
        variant === "overlay" && "max-w-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full bg-zinc-200 dark:bg-zinc-800">
        {slides.map((src, i) => (
          <Image
            key={`${src}-${i}`}
            src={src}
            alt=""
            fill
            sizes="420px"
            className={cn(
              "object-cover transition-opacity duration-500 ease-in-out",
              i === active ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== active}
            priority={i === 0}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {slides.slice(0, 6).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === active % Math.min(6, slides.length)
                  ? "w-3 bg-white"
                  : "w-1 bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
          Disponibilidad en vivo
        </p>
        <p className="mt-1.5 text-sm font-medium text-amber-950 dark:text-amber-50">
          Consultando la disponibilidad de{" "}
          {categoryId ? (
            <>
              <span className="font-bold">{label}</span> que seleccionaste
            </>
          ) : (
            "los alojamientos que seleccionaste"
          )}{" "}
          en este momento…
        </p>
        <p className="mt-1 text-[11px] text-amber-900/80 dark:text-amber-200/80">
          Revisamos calendarios iCal de las unidades para confirmar cupo.
        </p>
      </div>
    </motion.div>
  );
}
