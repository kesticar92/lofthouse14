"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSENT_EVENT } from "@/components/analytics/behavior-analytics";

const STORAGE_KEY = "lofthouse14_consent_v1";

type ConsentState = "unknown" | "granted" | "denied";

function applyConsent(state: "granted" | "denied") {
  const value = state === "granted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
  if (state === "granted" && typeof window.fbq === "function") {
    window.fbq("consent", "grant");
  }
  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, { detail: { state } }),
  );
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    if (saved === "granted" || saved === "denied") {
      applyConsent(saved);
      return;
    }
    setVisible(true);
  }, []);

  const choose = (state: "granted" | "denied") => {
    localStorage.setItem(STORAGE_KEY, state);
    applyConsent(state);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 top-[4.5rem] z-40 mx-auto max-w-xl rounded-2xl border border-black/10 bg-[#f2f0eb]/95 p-4 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/95 md:top-auto md:bottom-6"
    >
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        Usamos cookies de medición (GA4
        {process.env.NEXT_PUBLIC_CLARITY_ID || process.env.NEXT_PUBLIC_HOTJAR_ID
          ? ", Clarity/Hotjar"
          : ""}
        ) y, si aceptas, de marketing (Meta) para mejorar el sitio y medir
        reservas. Puedes aceptar o rechazar.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => choose("granted")}>
          Aceptar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => choose("denied")}
        >
          Solo esenciales
        </Button>
      </div>
    </div>
  );
}
