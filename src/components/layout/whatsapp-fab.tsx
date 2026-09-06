"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { waLink, site } from "@/lib/site";
import { trackWhatsAppClick } from "@/lib/analytics";
import { STICKY_BOOKING_VISIBLE_EVENT } from "@/lib/stay-draft";
import {
  GoogleMapsIcon,
  WhatsAppLogoIcon,
} from "@/components/layout/share-bar-icons";
import { cn } from "@/lib/cn";

export function WhatsAppFab() {
  const [liftForSticky, setLiftForSticky] = useState(false);

  useEffect(() => {
    const onSticky = (event: Event) => {
      const custom = event as CustomEvent<{ visible?: boolean }>;
      setLiftForSticky(Boolean(custom.detail?.visible));
    };
    window.addEventListener(STICKY_BOOKING_VISIBLE_EVENT, onSticky);
    return () =>
      window.removeEventListener(STICKY_BOOKING_VISIBLE_EVENT, onSticky);
  }, []);

  return (
    <div
      className={cn(
        "fixed right-5 z-[60] flex flex-col items-end gap-3 transition-[bottom] duration-300",
        liftForSticky ? "bottom-[13.5rem] md:bottom-5" : "bottom-5",
      )}
    >
      <motion.a
        href={site.google_url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 shadow-lg shadow-zinc-900/20 ring-2 ring-white/25 dark:bg-zinc-800 dark:ring-black/20"
        aria-label="Ubicación en Google Maps"
      >
        <GoogleMapsIcon className="h-7 w-auto" />
      </motion.a>

      <motion.a
        href={waLink()}
        onClick={() => trackWhatsAppClick("fab")}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg shadow-zinc-900/25 ring-2 ring-white/30 dark:bg-zinc-100 dark:ring-black/30"
        aria-label={`Reservar por WhatsApp — ${site.name}`}
      >
        <WhatsAppLogoIcon className="size-9" />
      </motion.a>
    </div>
  );
}
