"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TestimonialsColumn,
  carouselDurationForCount,
} from "@/components/layout/testimonial";
import { motion } from "framer-motion";
import {
  buildTestimonials,
  countBySource,
  formatMonthLabel,
  monthKey,
} from "@/lib/reviews/build-testimonials";
import { loftFilterOptions } from "@/lib/reviews/airbnb-listings";
import type { ReviewSource, Testimonial } from "@/lib/reviews/types";

const PLATFORM_OPTIONS: { value: "all" | ReviewSource; label: string }[] = [
  { value: "all", label: "Todas las plataformas" },
  { value: "google", label: "Google" },
  { value: "booking", label: "Booking" },
  { value: "airbnb", label: "Airbnb" },
];

function applyFilters(
  reviews: Testimonial[],
  platform: "all" | ReviewSource,
  month: string,
  loft: string,
): Testimonial[] {
  return reviews.filter((t) => {
    if (platform !== "all" && t.source !== platform) return false;
    if (month !== "all") {
      const mk = monthKey(t.reviewDate);
      if (mk !== month) return false;
    }
    if (loft !== "all") {
      if (t.source === "airbnb") {
        if (t.loftCode !== loft) return false;
      } else {
        return false;
      }
    }
    return true;
  });
}

function splitIntoColumns(
  items: Testimonial[],
  columnCount: number,
): Testimonial[][] {
  const n = Math.max(1, columnCount);
  const cols: Testimonial[][] = Array.from({ length: n }, () => []);
  items.forEach((item, index) => {
    cols[index % n]!.push(item);
  });
  return cols;
}

type TestimonialsUsageProps = {
  /** En home limitamos cards y omitimos avatares remotos (HTML de ~8MB). */
  variant?: "home" | "full";
  limit?: number;
};

const TestimonialsUsage = ({
  variant = "full",
  limit,
}: TestimonialsUsageProps) => {
  const homeLimit = limit ?? (variant === "home" ? 12 : undefined);
  const totalCount = useMemo(() => buildTestimonials().length, []);
  const bundled = useMemo(() => {
    const all = buildTestimonials();
    return homeLimit ? all.slice(0, homeLimit) : all;
  }, [homeLimit]);
  const [reviews, setReviews] = useState<Testimonial[]>(bundled);

  useEffect(() => {
    if (variant === "home") return;
    fetch("/api/public/reviews", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { testimonials?: Testimonial[] } | null) => {
        if (data?.testimonials?.length) {
          setReviews(data.testimonials);
        }
      })
      .catch(() => {
        /* JSON embebido en bundled */
      });
  }, [variant]);

  const displayReviews = useMemo(() => {
    if (variant !== "home") return reviews;
    // Sin avatares remotos en home: evita miles de URLs largas en el HTML.
    return reviews.map((r) => ({ ...r, image: "/default-avatar.png" }));
  }, [reviews, variant]);

  const sourceCounts = useMemo(
    () => countBySource(displayReviews),
    [displayReviews],
  );

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const r of displayReviews) {
      const mk = monthKey(r.reviewDate);
      if (mk) keys.add(mk);
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [displayReviews]);

  const [platform, setPlatform] = useState<"all" | ReviewSource>("all");
  const [month, setMonth] = useState<string>("all");
  const [loft, setLoft] = useState<string>("all");

  const showLoftFilter = platform === "all" || platform === "airbnb";
  const loftForFilter = showLoftFilter ? loft : "all";
  const showFilters = variant === "full";

  const filtered = useMemo(
    () => applyFilters(displayReviews, platform, month, loftForFilter),
    [displayReviews, platform, month, loftForFilter],
  );

  const filteredCounts = useMemo(() => countBySource(filtered), [filtered]);

  const filtersActive =
    platform !== "all" ||
    month !== "all" ||
    (showLoftFilter && loft !== "all");

  const scrollFactor = 3.4;
  const columnDuration = (count: number) =>
    carouselDurationForCount(count, scrollFactor);

  const colsMobile = splitIntoColumns(filtered, 1);
  const colsTablet = splitIntoColumns(filtered, 2);
  const colsDesktop = splitIntoColumns(filtered, 3);

  const selectClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto sm:min-w-[200px]";

  return (
    <section
      id="testimonios"
      className="relative overflow-x-hidden overflow-hidden px-4 py-12 md:px-20 md:py-20"
    >
      <div className="absolute inset-0 -z-10 bg-zinc-50 dark:bg-black/20" />

      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 flex max-w-[840px] flex-col items-center text-center"
        >
          <h2 className="font-display text-3xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] sm:text-4xl md:text-5xl">
            Lo que dicen nuestros huéspedes — reseñas verificadas
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            {variant === "home"
              ? "Opiniones reales de Google, Booking y Airbnb. En la página de reseñas puedes filtrar por plataforma, mes o loft."
              : "No editamos ni seleccionamos solo las mejores puntuaciones. Elige la plataforma, el mes o el loft específico y descubre la perspectiva honesta de nuestra comunidad de huéspedes."}
          </p>
        </motion.div>

        {showFilters ? (
          <div className="mx-auto mb-8 flex max-w-5xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <label className="flex flex-col gap-1 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Plataforma
              <select
                className={selectClass}
                value={platform}
                onChange={(e) => {
                  const next = e.target.value as "all" | ReviewSource;
                  setPlatform(next);
                  if (next === "google" || next === "booking") {
                    setLoft("all");
                  }
                }}
                aria-label="Filtrar por plataforma"
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Mes
              <select
                className={selectClass}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label="Filtrar por mes"
              >
                <option value="all">Todos los meses</option>
                {monthOptions.map((mk) => (
                  <option key={mk} value={mk}>
                    {formatMonthLabel(mk)}
                  </option>
                ))}
              </select>
            </label>
            {showLoftFilter ? (
              <label className="flex flex-col gap-1 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Unidad Airbnb
                <select
                  className={selectClass}
                  value={loft}
                  onChange={(e) => setLoft(e.target.value)}
                  aria-label="Filtrar por loft o casa entera"
                >
                  {loftFilterOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}

        <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-300">
          {filtersActive ? (
            <>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {filteredCounts.total}
              </span>{" "}
              {filteredCounts.total === 1 ? "reseña" : "reseñas"} con estos
              filtros
            </>
          ) : (
            <>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {sourceCounts.total}
              </span>{" "}
              {variant === "home" ? "reseñas destacadas" : "reseñas en total"} ·
              Google{" "}
              <span className="font-semibold">{sourceCounts.google}</span> ·
              Booking{" "}
              <span className="font-semibold">{sourceCounts.booking}</span> ·
              Airbnb{" "}
              <span className="font-semibold">{sourceCounts.airbnb}</span>
            </>
          )}
        </p>

        {filtered.length > 0 ? (
          <div className="mx-auto flex w-full min-w-0 justify-center gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)] max-h-[min(78vh,820px)] overflow-hidden sm:gap-5 md:gap-6">
            <div className="flex w-full justify-center gap-4 sm:hidden">
              <TestimonialsColumn
                testimonials={colsMobile[0] ?? []}
                duration={columnDuration(filtered.length)}
              />
            </div>
            <div className="hidden w-full justify-center gap-4 sm:flex md:hidden">
              {colsTablet.map((col, i) => (
                <TestimonialsColumn
                  key={`t-${i}`}
                  testimonials={col}
                  duration={columnDuration(col.length)}
                />
              ))}
            </div>
            <div className="hidden w-full justify-center gap-4 md:flex">
              {colsDesktop.map((col, i) => (
                <TestimonialsColumn
                  key={`d-${i}`}
                  testimonials={col}
                  duration={columnDuration(col.length)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-500">
            No hay reseñas con estos filtros. Prueba otro mes o unidad.
          </div>
        )}

        {variant === "home" ? (
          <p className="mt-8 text-center">
            <Link
              href="/resenas"
              className="text-sm font-bold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400"
            >
              Ver las {totalCount}+ reseñas con filtros →
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default TestimonialsUsage;
