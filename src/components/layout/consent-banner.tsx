"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "lofthouse14-consent-v1";

type ConsentState = "pending" | "granted" | "denied";

function pushConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  const value = granted ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "consent_update",
    consent: value,
  });
}

export function ConsentBanner() {
  const [state, setState] = useState<ConsentState>("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as
        | "granted"
        | "denied"
        | null;
      if (saved === "granted" || saved === "denied") {
        setState(saved);
        pushConsent(saved === "granted");
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || state !== "granted") return;
    let fired50 = false;
    let fired90 = false;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = (window.scrollY / max) * 100;
      if (!fired50 && pct >= 50) {
        fired50 = true;
        trackEvent("scroll", { percent_scrolled: 50 });
      }
      if (!fired90 && pct >= 90) {
        fired90 = true;
        trackEvent("scroll", { percent_scrolled: 90 });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ready, state]);

  if (!ready || state !== "pending") return null;

  function choose(next: "granted" | "denied") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    pushConsent(next === "granted");
    setState(next);
    trackEvent("consent_choice", { consent: next });
  }

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-zinc-950/95 md:inset-x-auto md:right-4 md:bottom-4"
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-[#f2f0eb]">
        Cookies y medición (Consent Mode v2)
      </p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
        Usamos cookies de analítica y, si configuras Pixel/Ads, de marketing para
        mejorar reservas. Puedes aceptar o rechazar. Detalles en{" "}
        <Link href="/politicas" className="underline">
          Políticas
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold dark:border-zinc-600"
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
