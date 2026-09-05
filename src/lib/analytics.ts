export type AnalyticsPayload = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      target: string,
      params?: AnalyticsPayload,
    ) => void;
    fbq?: (
      command: "track" | "init" | "trackCustom",
      event: string,
      params?: AnalyticsPayload,
    ) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(name: string, params?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
  window.dataLayer?.push({ event: name, ...params });
}

export function trackWhatsApp(placement: string) {
  trackEvent("contact", {
    method: "whatsapp",
    placement,
  });
  window.fbq?.("track", "Contact", { method: "whatsapp", placement });
}

export function trackBeginCheckout(params?: AnalyticsPayload) {
  trackEvent("begin_checkout", params);
  window.fbq?.("track", "InitiateCheckout", params);
}

export function trackViewItem(params: AnalyticsPayload) {
  trackEvent("view_item", params);
  window.fbq?.("track", "ViewContent", params);
}
