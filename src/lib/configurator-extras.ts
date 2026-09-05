export type ExtraPricing = "flat" | "perGuestPerDay" | "perAirportLeg";

export type ConfiguratorExtra = {
  id: string;
  label: string;
  description: string;
  /** COP: fijo, o por huésped por día (comidas). 0 = consultar. */
  priceCop: number;
  interestOnly?: boolean;
  pricing?: ExtraPricing;
};

export const CONFIGURATOR_EXTRAS: ConfiguratorExtra[] = [
  {
    id: "early-checkin",
    label: "Early check-in",
    description: "Ingreso antes del horario estándar, sujeto a disponibilidad.",
    priceCop: 60_000,
    pricing: "flat",
  },
  {
    id: "late-checkout",
    label: "Late check-out",
    description: "Salida después de las 11:00 a.m. si la unidad lo permite.",
    priceCop: 60_000,
    pricing: "flat",
  },
  {
    id: "airport-transfer",
    label: "Traslado aeropuerto",
    description:
      "Automóvil privado sedán con aire acondicionado. Elige recogida en aeropuerto y/o traslado de salida al aeropuerto ($70.000 por trayecto).",
    priceCop: 70_000,
    pricing: "perAirportLeg",
  },
  {
    id: "pet",
    label: "Mascota",
    description: "Hasta 2 mascotas con autorización previa.",
    priceCop: 30_000,
    pricing: "flat",
  },
  {
    id: "breakfast",
    label: "Desayuno completo de la casa",
    description:
      "Empieza el día con energía: café o chocolate caliente, leche, huevos al gusto, pan blanco fresco y porción de arroz o fruta de temporada. Servido a partir del día siguiente al check-in.",
    priceCop: 15_000,
    pricing: "perGuestPerDay",
  },
  {
    id: "lunch",
    label: "Almuerzo tradicional completo",
    description:
      "Menú balanceado: sopa y principio del día, ensalada fresca, arroz, proteína a tu elección y bebida natural. Disponible a partir del día siguiente al check-in.",
    priceCop: 20_000,
    pricing: "perGuestPerDay",
  },
  {
    id: "salsa",
    label: "Clases de salsa",
    description: "Te conectamos con academias cercanas (precio según academia).",
    priceCop: 0,
    interestOnly: true,
  },
  {
    id: "gastro",
    label: "Ruta gastronómica",
    description: "Recomendaciones curadas en Miraflores y alrededores.",
    priceCop: 0,
    interestOnly: true,
  },
];

export type MealExtraId = "breakfast" | "lunch";

export type MealExtraQuantity = {
  days: number;
  guests: number;
};

export type AirportTransferChoice = {
  pickup: boolean;
  dropoff: boolean;
};

export function airportTransferLegCount(choice: AirportTransferChoice): number {
  return (choice.pickup ? 1 : 0) + (choice.dropoff ? 1 : 0);
}

/**
 * Días sugeridos al marcar comidas (precarga en el configurador).
 * 1 noche → al menos 1 día; más noches → noches − 1 (sin el día de check-in).
 */
export function mealDefaultDays(noches: number): number {
  if (noches <= 0) return 0;
  if (noches === 1) return 1;
  return noches - 1;
}

/** @deprecated Usa {@link mealDefaultDays}. */
export function mealEligibleDays(noches: number): number {
  return mealDefaultDays(noches);
}

export function extraUnitLabel(extra: ConfiguratorExtra): string {
  if (extra.interestOnly) return "Consultar";
  if (extra.pricing === "perGuestPerDay") {
    return `+ ${formatCopPlain(extra.priceCop)} / pers. / día`;
  }
  return `+ ${formatCopPlain(extra.priceCop)}`;
}

function formatCopPlain(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export type ExtraLineContext = {
  mealQty?: MealExtraQuantity;
  airport?: AirportTransferChoice;
};

export function extraLineTotalCop(
  extra: ConfiguratorExtra,
  ctx?: ExtraLineContext,
): number {
  if (extra.interestOnly || extra.priceCop <= 0) return 0;
  if (extra.pricing === "perGuestPerDay") {
    const days = Math.max(0, ctx?.mealQty?.days ?? 0);
    const g = Math.max(0, ctx?.mealQty?.guests ?? 0);
    return extra.priceCop * days * g;
  }
  if (extra.pricing === "perAirportLeg") {
    const legs = airportTransferLegCount(
      ctx?.airport ?? { pickup: false, dropoff: false },
    );
    return extra.priceCop * legs;
  }
  return extra.priceCop;
}

export function extrasTotalCop(
  selectedIds: string[],
  mealQuantities: Partial<Record<MealExtraId, MealExtraQuantity>>,
  airportTransfer: AirportTransferChoice,
): number {
  let sum = 0;
  for (const extra of CONFIGURATOR_EXTRAS) {
    if (!selectedIds.includes(extra.id)) continue;
    const ctx: ExtraLineContext = {};
    if (extra.id === "breakfast" || extra.id === "lunch") {
      ctx.mealQty = mealQuantities[extra.id];
    }
    if (extra.id === "airport-transfer") {
      ctx.airport = airportTransfer;
    }
    sum += extraLineTotalCop(extra, ctx);
  }
  return sum;
}

export type TripProfile =
  | "pareja"
  | "solo"
  | "familia"
  | "grupo"
  | "negocios"
  | "medico";

export const TRIP_PROFILES: {
  id: TripProfile;
  title: string;
  hint: string;
  suggestedLofts: number;
}[] = [
  {
    id: "solo",
    title: "Viajo solo",
    hint: "Un loft suele bastar.",
    suggestedLofts: 1,
  },
  {
    id: "pareja",
    title: "En pareja",
    hint: "1 loft, base para 2 personas.",
    suggestedLofts: 1,
  },
  {
    id: "familia",
    title: "Familia",
    hint: "2–3 lofts según edades y privacidad.",
    suggestedLofts: 2,
  },
  {
    id: "grupo",
    title: "Grupo o delegación",
    hint: "Varios lofts; el total se suma por unidad.",
    suggestedLofts: 4,
  },
  {
    id: "negocios",
    title: "Negocios",
    hint: "Loft individual o bloque para equipo.",
    suggestedLofts: 1,
  },
  {
    id: "medico",
    title: "Salud / rotación",
    hint: "Estadías de semanas; cotización final por WhatsApp.",
    suggestedLofts: 1,
  },
];
