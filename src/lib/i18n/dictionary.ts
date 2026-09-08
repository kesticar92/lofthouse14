/**
 * i18n foundation — diccionario mínimo ES/EN para nav huésped y CTAs clave.
 * Sin next-intl todavía: resolución por locale explícito o path `/en`.
 */

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";

const dict = {
  es: {
    "nav.book": "Reservar",
    "nav.myReservation": "Mi reserva",
    "nav.messages": "Mensajes",
    "nav.help": "Ayuda",
    "cta.seeReservation": "Ver reserva",
    "cta.checkIn": "Check-in digital",
    "cta.whatsappHelp": "WhatsApp ayuda",
    "cta.payMock": "Simular pago (mock)",
    "cta.payDeposit": "Pagar depósito (mock)",
    "cta.payBalance": "Pagar saldo (mock)",
    "cta.newBooking": "Hacer una nueva reserva →",
    "cta.helpCenter": "Centro de ayuda",
    "cta.anotherReservation": "Otra reserva",
    "cta.messages": "Mensajes",
    "guest.myReservationTitle": "Mi reserva",
    "guest.myReservationHint":
      "Ingresa tu código (ej. LH-XXXXXX) para ver estado, resumen de precio y completar el check-in digital.",
    "guest.codePlaceholder": "LH-XXXXXX",
    "guest.codeRequired": "Escribe tu código de reserva",
    "guest.loading": "Cargando reserva…",
    "guest.yourReservation": "Tu reserva",
    "guest.invoiceDraft": "Factura borrador",
    "guest.paymentSummary": "Resumen de precio",
    "guest.totalPending": "Total por confirmar",
    "guest.depositLabel": "Depósito",
    "guest.balanceDue": "Saldo pendiente",
    "currency.stubDisclaimer":
      "Tasas stub (no oficiales). Solo referencia de display.",
  },
  en: {
    "nav.book": "Book",
    "nav.myReservation": "My booking",
    "nav.messages": "Messages",
    "nav.help": "Help",
    "cta.seeReservation": "View booking",
    "cta.checkIn": "Digital check-in",
    "cta.whatsappHelp": "WhatsApp help",
    "cta.payMock": "Simulate payment (mock)",
    "cta.payDeposit": "Pay deposit (mock)",
    "cta.payBalance": "Pay balance (mock)",
    "cta.newBooking": "Make a new booking →",
    "cta.helpCenter": "Help center",
    "cta.anotherReservation": "Another booking",
    "cta.messages": "Messages",
    "guest.myReservationTitle": "My booking",
    "guest.myReservationHint":
      "Enter your code (e.g. LH-XXXXXX) to see status, price summary and complete digital check-in.",
    "guest.codePlaceholder": "LH-XXXXXX",
    "guest.codeRequired": "Enter your reservation code",
    "guest.loading": "Loading booking…",
    "guest.yourReservation": "Your booking",
    "guest.invoiceDraft": "Draft invoice",
    "guest.paymentSummary": "Price summary",
    "guest.totalPending": "Total to confirm",
    "guest.depositLabel": "Deposit",
    "guest.balanceDue": "Balance due",
    "currency.stubDisclaimer":
      "Stub rates (not official). Display reference only.",
  },
} as const;

export type MessageKey = keyof (typeof dict)["es"];

export function resolveLocale(input?: string | null): Locale {
  const raw = (input ?? "").toLowerCase().trim();
  if (raw.startsWith("en")) return "en";
  return "es";
}

export function t(
  key: MessageKey,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return dict[locale][key] ?? dict.es[key] ?? key;
}

export function localeFromPathname(pathname: string | null | undefined): Locale {
  if (!pathname) return DEFAULT_LOCALE;
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return "es";
}
