"use client";

import { motion } from "framer-motion";
import { waLink, site } from "@/lib/site";
import {
  GoogleMapsIcon,
  WhatsAppLogoIcon,
} from "@/components/layout/share-bar-icons";

export function WhatsAppFab() {
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
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
