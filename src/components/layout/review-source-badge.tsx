"use client";

import type { ReviewSource } from "@/lib/reviews/types";

const badgeShell =
  "inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1.5 shadow-sm dark:bg-zinc-900/80";

/** SVG inline: evita cientos de <img>/_next/image en el carrusel de reseñas. */
function GoogleBadge() {
  return (
    <span
      className={`${badgeShell} border-zinc-200/80 dark:border-white/10`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span className="text-[10px] font-bold tracking-tight text-zinc-700 dark:text-zinc-200">
        Google
      </span>
    </span>
  );
}

function AirbnbMark() {
  return (
    <svg
      width="54"
      height="14"
      viewBox="0 0 320 100"
      aria-label="Airbnb"
      role="img"
    >
      <path
        fill="#FF5A5F"
        d="M160 20c-18 28-42 56-42 78 0 12 9 22 22 22s22-10 22-22c0-22-24-50-42-78zm0 0c18 28 42 56 42 78 0 12-9 22-22 22s-22-10-22-22c0-22 24-50 42-78z"
      />
      <text
        x="210"
        y="64"
        fill="#FF5A5F"
        fontSize="42"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        airbnb
      </text>
    </svg>
  );
}

function AirbnbBadge({ href }: { href?: string }) {
  const className = `${badgeShell} border-[#FF5A5F]/25 transition hover:border-[#FF5A5F]/50`;
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title="Ver publicación en Airbnb"
      >
        <AirbnbMark />
      </a>
    );
  }
  return (
    <span className={className}>
      <AirbnbMark />
    </span>
  );
}

function BookingBadge() {
  return (
    <span
      className={`${badgeShell} border-[#003580]/25 dark:border-sky-400/30`}
    >
      <span className="text-[11px] font-extrabold tracking-tight text-[#003580] dark:text-[#5b9cff]">
        Booking
        <span className="font-semibold text-[#009fe3]">.com</span>
      </span>
    </span>
  );
}

export function ReviewSourceBadge({
  source,
  listingUrl,
}: {
  source: ReviewSource;
  listingUrl?: string;
}) {
  if (source === "airbnb") {
    return <AirbnbBadge href={listingUrl} />;
  }
  if (source === "booking") {
    return <BookingBadge />;
  }
  return <GoogleBadge />;
}
