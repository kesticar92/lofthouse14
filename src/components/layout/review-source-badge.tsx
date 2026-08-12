"use client";

import Image from "next/image";
import type { ReviewSource } from "@/lib/reviews/types";

const badgeShell =
  "inline-flex items-center rounded-full border bg-white px-2.5 py-1.5 shadow-sm dark:bg-zinc-900/80";

function GoogleBadge() {
  return (
    <span
      className={`${badgeShell} gap-1.5 border-zinc-200/80 dark:border-white/10`}
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

function AirbnbBadge({ href }: { href?: string }) {
  const logo = (
    <Image
      src="/logos/airbnb.svg"
      alt="Airbnb"
      width={320}
      height={100}
      className="h-[14px] w-auto"
      priority={false}
    />
  );

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
        {logo}
      </a>
    );
  }
  return <span className={className}>{logo}</span>;
}

function BookingBadge() {
  return (
    <span className={`${badgeShell} border-[#003580]/25`}>
      <Image
        src="/logos/booking.svg"
        alt="Booking.com"
      width={119}
      height={20}
        className="h-[14px] w-auto"
        priority={false}
      />
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
