"use client";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
  if (window.fbq) {
    if (name === "contact" || name === "begin_checkout" || name === "purchase") {
      window.fbq("trackCustom", name, params);
    } else if (name === "view_item") {
      window.fbq("track", "ViewContent", params);
    }
  }
}

export function trackWhatsAppClick(context: string) {
  trackEvent("contact", {
    method: "whatsapp",
    context,
  });
}

export function trackBeginCheckout(extra?: Record<string, string | number>) {
  trackEvent("begin_checkout", {
    currency: "COP",
    ...extra,
  });
}

export function trackViewItem(itemId: string, itemName: string) {
  trackEvent("view_item", {
    item_id: itemId,
    item_name: itemName,
  });
}
