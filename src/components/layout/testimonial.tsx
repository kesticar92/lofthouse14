"use client";

import React from "react";
import type { Testimonial } from "@/lib/reviews/types";
import {
  formatBookingScore,
  formatReviewDate,
} from "@/lib/reviews/build-testimonials";
import { ReviewSourceBadge } from "@/components/layout/review-source-badge";
import { BookingReviewBody } from "@/components/layout/booking-review-body";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

const StarIcon = ({ fill = "currentColor" }: { fill?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const getInitials = (name: string) => {
  if (!name) return "H";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
};

interface TestimonialsColumnProps {
  className?: string;
  testimonials: Testimonial[];
  /** Segundos por recorrer el bloque duplicado (como FAQ). */
  duration?: number;
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const dateLabel = formatReviewDate(testimonial.reviewDate);

  return (
    <article className="group box-border w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-zinc-200/90 bg-white/70 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur-md transition hover:bg-white sm:p-6 dark:border-white/10 dark:bg-zinc-900/50 dark:shadow-black/30 dark:hover:bg-zinc-900/70">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <ReviewSourceBadge
          source={testimonial.source}
          listingUrl={testimonial.listingUrl}
        />
        {dateLabel ? (
          <time
            dateTime={testimonial.reviewDate ?? undefined}
            className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            {dateLabel}
          </time>
        ) : null}
      </div>

      {testimonial.listingLabel ? (
        <p className="mb-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {testimonial.listingLabel}
        </p>
      ) : null}

      {testimonial.source === "booking" ? (
        <BookingReviewBody
          positive={testimonial.bookingPositive}
          negative={testimonial.bookingNegative}
          fallbackText={testimonial.text}
        />
      ) : (
        <p className="mb-5 break-words text-sm leading-relaxed text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-200">
          &ldquo;{testimonial.text}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          {testimonial.image && testimonial.image !== "/default-avatar.png" ? (
            <img
              width={40}
              height={40}
              src={testimonial.image}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-amber-100 text-xs font-bold text-amber-900 dark:border-white/10 dark:bg-amber-950/40 dark:text-amber-200">
              {getInitials(testimonial.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
              {testimonial.name}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Huésped verificado
            </p>
          </div>
        </div>
        {testimonial.source === "booking" &&
        testimonial.bookingScore != null ? (
          <div
            className="flex shrink-0 flex-col items-end leading-none"
            title="Puntuación Booking.com (0–10)"
          >
            <span className="text-xl font-bold tabular-nums text-[#003580] dark:text-[#5b9cff]">
              {formatBookingScore(testimonial.bookingScore)}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              / 10
            </span>
          </div>
        ) : (
          <div
            className="flex shrink-0 gap-0.5"
            aria-label={`${Math.round(testimonial.starRating)} de 5 estrellas`}
          >
            {[...Array(5)].map((_, starIdx) => (
              <StarIcon
                key={starIdx}
                fill={
                  starIdx < Math.round(testimonial.starRating)
                    ? "#FBBC05"
                    : "#E5E7EB"
                }
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/** Duración suave tipo FAQ: ~3.2 s por tarjeta, mínimo 40 s. */
export function carouselDurationForCount(count: number, factor = 3.2): number {
  if (count <= 0) return 40;
  return Math.max(40, Math.round(count * factor));
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration,
}: TestimonialsColumnProps) => {
  const reduceMotion = useReducedMotion();

  if (testimonials.length === 0) return null;

  const durationSec =
    duration ?? carouselDurationForCount(testimonials.length);

  const cards = testimonials.map((t) => (
    <TestimonialCard key={t.id} testimonial={t} />
  ));

  if (reduceMotion) {
    return (
      <div className={cn("flex min-w-0 flex-1 flex-col gap-5", className)}>
        {cards}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "testimonial-scroll-column min-w-0 flex-1 max-w-xs",
        className,
      )}
    >
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: durationSec,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {testimonials.map((t) => (
              <TestimonialCard key={`${loop}-${t.id}`} testimonial={t} />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export { TestimonialCard };
export type { Testimonial };
