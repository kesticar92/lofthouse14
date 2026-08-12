"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { site, waLink } from "@/lib/site";
import {
  GoogleMapsIcon,
  ShareIosIcon,
  WhatsAppLogoIcon,
} from "@/components/layout/share-bar-icons";

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
          <ShareIosIcon />
        </AppleActionButton>

        <AppleActionButton
          href={site.google_url}
          label="Ubicación en Google Maps"
          className="bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <GoogleMapsIcon />
        </AppleActionButton>

        <AppleActionButton
          href={waLink()}
          label={`WhatsApp — ${site.name}`}
          className="bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <WhatsAppLogoIcon className="size-[1.65rem]" />
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
