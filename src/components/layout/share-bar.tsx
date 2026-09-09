"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { site, waLink } from "@/lib/site";
import { trackWhatsAppClick } from "@/lib/analytics";
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
        onClick={onClick}
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

/**
 * Columna única de acciones rápidas: compartir → Maps → WhatsApp.
 * Evita el desorden de FABs duplicados.
 */
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
          "flex flex-col gap-1.5 rounded-[1.35rem] border p-1.5 shadow-2xl backdrop-blur-2xl",
          "border-[#1c1917]/14 bg-[#ebe6dc]/90",
          "dark:border-[#f2f0eb]/12 dark:bg-[#1c1917]/90",
        )}
      >
        <AppleActionButton
          onClick={handleShare}
          label="Compartir"
          className="bg-[#ebe6dc] text-[#141210] hover:bg-[#e2dccf] dark:bg-[#1c1917] dark:text-[#f2f0eb] dark:hover:bg-[#25211d]"
        >
          <ShareIosIcon />
        </AppleActionButton>

        <AppleActionButton
          href={site.google_url}
          label="Ubicación en Google Maps"
          className="bg-[#ebe6dc] text-[#141210] hover:bg-[#e2dccf] dark:bg-[#1c1917] dark:text-[#f2f0eb] dark:hover:bg-[#25211d]"
        >
          <GoogleMapsIcon />
        </AppleActionButton>

        <AppleActionButton
          href={waLink()}
          label={`WhatsApp — ${site.name}`}
          className="bg-[#ebe6dc] text-[#141210] hover:bg-[#e2dccf] dark:bg-[#1c1917] dark:text-[#f2f0eb] dark:hover:bg-[#25211d]"
          onClick={() => trackWhatsAppClick("fab")}
        >
          <WhatsAppLogoIcon className="size-[1.65rem]" />
        </AppleActionButton>
      </div>

      {copied ? (
        <span className="rounded-full bg-[#1c1917]/90 px-3 py-1 text-[10px] font-medium text-[#f2f0eb] backdrop-blur-md dark:bg-[#ebe6dc]/95 dark:text-[#141210]">
          Enlace copiado
        </span>
      ) : null}
    </div>
  );
}
