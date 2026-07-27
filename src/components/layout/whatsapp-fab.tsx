"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { waLink, site } from "@/lib/site";

export function WhatsAppFab() {
  const [loadingRoute, setLoadingRoute] = useState(false);

  async function openRouteInMaps() {
    if (!("geolocation" in navigator)) {
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
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`,
          "_blank",
          "noopener,noreferrer",
        );
        setLoadingRoute(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      <motion.button
        type="button"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={openRouteInMaps}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/35 ring-2 ring-white/25 dark:bg-[#f2f0eb] dark:text-zinc-900 dark:ring-black/20"
        aria-label="Cómo llegar en Google Maps"
      >
        {loadingRoute ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          /* iPhone-style location pin */
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
            <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
          </svg>
        )}
      </motion.button>

      <motion.a
        href={waLink()}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/30 ring-2 ring-white/30 dark:ring-black/30"
        aria-label={`Reservar por WhatsApp — ${site.name}`}
      >
        {/* Logo oficial WhatsApp — burbuja + auricular */}
        <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.8L2.05 22l5.43-1.43c1.37.73 2.94 1.15 4.56 1.15 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 1.67c4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24c-1.48 0-2.87-.4-4.07-1.09l-.29-.17-3.02.79.81-2.93-.19-.3a8.2 8.2 0 0 1-1.22-4.3c0-4.54 3.7-8.24 8.24-8.24zm-2.46 4.17c-.18 0-.47.07-.71.33-.24.27-.93.91-.93 2.22 0 1.3.95 2.56 1.08 2.74.13.17 1.85 2.98 4.57 4.06.64.27 1.14.44 1.53.56.64.2 1.23.17 1.69.1.52-.07 1.59-.65 1.81-1.28.23-.63.23-1.17.16-1.28-.06-.1-.22-.16-.47-.28-.25-.12-1.49-.73-1.72-.82-.23-.08-.4-.12-.56.12-.17.24-.64.82-.79.99-.14.16-.29.18-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.01-.39.11-.51.11-.11.25-.29.38-.44.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.42z"/>
        </svg>
      </motion.a>
    </div>
  );
}
