import {
  DEFAULT_PRICING,
  quote,
  type PricingConfig,
  type QuoteInput,
  type QuoteResult,
} from "@/lib/pricing";
import { site } from "@/lib/site";

/** Tarifas web: mismas bases que admin, sin descuentos automáticos. */
export const PUBLIC_PRICING_CONFIG: PricingConfig = {
  ...DEFAULT_PRICING,
  descuentoSemanal: 0,
  descuentoMensual: 0,
  comisionAirbnb: 0,
};

export type PublicStayQuoteResult = QuoteResult & {
  disclaimers: string[];
};

function diffNights(checkIn: string, checkOut: string): number | null {
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Cotización estimada para la web (1–N lofts, sin descuentos de grupo o larga estadía).
 */
export function publicStayQuote(
  input: QuoteInput,
  cfg: PricingConfig = PUBLIC_PRICING_CONFIG,
): PublicStayQuoteResult {
  const lofts = Math.max(1, Math.floor(input.lofts || 1));
  const huespedes = Math.max(0, Math.floor(input.huespedes || 0));
  const disclaimers: string[] = [];

  const fail = (error: string): PublicStayQuoteResult => ({
    ok: false,
    error,
    noches: 0,
    nochesLJ: 0,
    nochesVD: 0,
    subtotalAlojamiento: 0,
    recargoHuespedes: 0,
    aseoTotal: 0,
    aseoDetalle: "",
    subtotalReserva: 0,
    descuento: 0,
    descuentoDetalle: "",
    totalReserva: 0,
    comisionAirbnb: 0,
    totalConComisionAirbnb: 0,
    nightByNight: [],
    disclaimers,
  });

  if (huespedes < 1) return fail("Indica cuántas personas viajan.");
  if (huespedes > site.maxGuests) {
    return fail(
      `La capacidad máxima del hotel es ${site.maxGuests} huéspedes. Escríbenos por WhatsApp para coordinar.`,
    );
  }
  if (lofts < 1 || lofts > site.maxLofts) {
    return fail(`Puedes reservar entre 1 y ${site.maxLofts} lofts.`);
  }
  if (huespedes > lofts * site.maxGuestsPerLoft) {
    return fail(
      `Con ${lofts} loft(s) caben hasta ${lofts * site.maxGuestsPerLoft} huéspedes. Aumenta lofts o contáctanos por WhatsApp.`,
    );
  }
  if (lofts === 1 && huespedes > site.maxGuestsPerLoft) {
    return fail(
      `Un solo loft admite hasta ${site.maxGuestsPerLoft} huéspedes. Indica más lofts para ver un total estimado.`,
    );
  }

  const nights = diffNights(input.checkIn, input.checkOut);
  if (nights !== null && nights >= 7) {
    disclaimers.push(
      "Estadías de 7 noches o más: el valor final y posibles ajustes se confirman por WhatsApp.",
    );
  }
  if (lofts > 1) {
    disclaimers.push(
      "Varios lofts: el total estimado suma la tarifa base de cada loft (mismas fechas).",
    );
  }
  if (huespedes > 10 || lofts >= 3) {
    disclaimers.push(
      "Reservas de grupo: no incluyen descuentos automáticos; negociación directa por WhatsApp.",
    );
  }

  const guestsPerLoft =
    lofts === 1
      ? huespedes
      : Math.min(
          site.maxGuestsPerLoft,
          Math.max(1, Math.ceil(huespedes / lofts)),
        );

  const single = quote(
    {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      huespedes: guestsPerLoft,
      lofts: 1,
    },
    cfg,
  );

  if (!single.ok) {
    return { ...single, disclaimers };
  }

  if (lofts === 1) {
    const subtotalReserva =
      single.subtotalAlojamiento +
      single.recargoHuespedes +
      single.aseoTotal;
    return {
      ...single,
      subtotalReserva,
      descuento: 0,
      descuentoDetalle: "Sin descuento automático en la web.",
      totalReserva: subtotalReserva,
      comisionAirbnb: 0,
      totalConComisionAirbnb: subtotalReserva,
      disclaimers,
    };
  }

  const subtotalAlojamiento = single.subtotalAlojamiento * lofts;
  const recargoHuespedes = single.recargoHuespedes * lofts;
  const aseoTotal = single.aseoTotal * lofts;
  const subtotalReserva =
    subtotalAlojamiento + recargoHuespedes + aseoTotal;

  return {
    ...single,
    subtotalAlojamiento,
    recargoHuespedes,
    aseoTotal,
    subtotalReserva,
    descuento: 0,
    descuentoDetalle: "Descuentos de grupo o larga estadía: solo por WhatsApp.",
    totalReserva: subtotalReserva,
    comisionAirbnb: 0,
    totalConComisionAirbnb: subtotalReserva,
    disclaimers,
  };
}
