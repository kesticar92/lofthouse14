"use client";

import { useCallback, useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { site, waLink } from "@/lib/site";

function AppleActionButton({
  onClick,
  href,
  label,
  className,
  children,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    "flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(base, className)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(base, className)}
    >
      {children}
    </button>
  );
}

export function ShareBar() {
  const [copied, setCopied] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    process.env.NEXT_PUBLIC_SITE_URL || "https://lofthouse14.com",
  );

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const shareText = `${site.name} — ${site.tagline}`;

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: site.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        /* cancelado */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [shareUrl, shareText]);

  const openLocation = useCallback(() => {
    const scrollToMap = () => {
      document
        .getElementById("ubicacion")
        ?.scrollIntoView({ behavior: "smooth" });
    };

    if (!("geolocation" in navigator)) {
      scrollToMap();
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    setLoadingRoute(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = `${coords.latitude},${coords.longitude}`;
        const destination = encodeURIComponent(site.mapQuery);
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
          "_blank",
          "noopener,noreferrer",
        );
        setLoadingRoute(false);
      },
      () => {
        scrollToMap();
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`,
          "_blank",
          "noopener,noreferrer",
        );
        setLoadingRoute(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
    );
  }, []);

  return (
    <div
      className="fixed bottom-6 right-4 z-[60] flex flex-col items-center gap-1"
      aria-label="Acciones rápidas"
    >
      <div
        className={cn(
          "flex flex-col gap-1 rounded-[1.35rem] border p-1.5 shadow-2xl",
          "border-white/50 bg-white/75 backdrop-blur-2xl",
          "dark:border-white/10 dark:bg-zinc-900/75",
        )}
      >
        <AppleActionButton
          onClick={handleShare}
          label="Compartir"
          className="bg-zinc-100 text-zinc-800 hover:bg-zinc-200/90 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          <Share2 className="size-[1.15rem] stroke-[2]" />
        </AppleActionButton>

        <AppleActionButton
          onClick={openLocation}
          label="Ubicación y cómo llegar"
          className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:hover:bg-white"
        >
          {loadingRoute ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="size-[1.35rem]"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
          )}
        </AppleActionButton>

        <AppleActionButton
          href={waLink()}
          label={`WhatsApp — ${site.name}`}
          className="bg-[#25D366] text-white hover:bg-[#20bd5a]"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-[1.35rem]"
            aria-hidden
            fill="currentColor"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.8L2.05 22l5.43-1.43c1.37.73 2.94 1.15 4.56 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 1.67c4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24c-1.48 0-2.87-.4-4.07-1.09l-.29-.17-3.02.79.81-2.93-.19-.3a8.2 8.2 0 0 1-1.22-4.3c0-4.54 3.7-8.24 8.24-8.24zm-2.46 4.17c-.18 0-.47.07-.71.33-.24.27-.93.91-.93 2.22 0 1.3.95 2.56 1.08 2.74.13.17 1.85 2.98 4.57 4.06.64.27 1.14.44 1.53.56.64.2 1.23.17 1.69.1.52-.07 1.59-.65 1.81-1.28.23-.63.23-1.17.16-1.28-.06-.1-.22-.16-.47-.28-.25-.12-1.49-.73-1.72-.82-.23-.08-.4-.12-.56.12-.17.24-.64.82-.79.99-.14.16-.29.18-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.51.11-.11.25-.29.38-.44.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.42z" />
          </svg>
        </AppleActionButton>
      </div>

      {copied ? (
        <span className="rounded-full bg-zinc-900/90 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md dark:bg-white/90 dark:text-zinc-900">
          Enlace copiado
        </span>
      ) : null}
    </div>
  );
}
