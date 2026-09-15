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

/** Capacidad máxima de pasajeros por vehículo de traslado. */
export const AIRPORT_VEHICLE_CAPACITY = 4;

/** Máximo de mascotas permitidas por loft (no por reserva). */
export const PETS_PER_LOFT = 2;

export const CONFIGURATOR_EXTRAS: ConfiguratorExtra[] = [
  {
    id: "early-checkin",
    label: "Early check-in",
    description:
      "Ingreso antes del horario estándar (3:00 p.m.), sujeto a disponibilidad. No aplica el mismo día a partir de las 2:00 p.m. Si reservas más de un loft, el valor es por cada loft que lo solicite.",
    priceCop: 60_000,
    pricing: "flat",
  },
  {
    id: "late-checkout",
    label: "Late check-out",
    description:
      "Salida después de las 11:00 a.m. si la unidad lo permite. Si reservas más de un loft, el valor es por cada loft que lo solicite.",
    priceCop: 60_000,
    pricing: "flat",
  },
  {
    id: "airport-transfer",
    label: "Traslado aeropuerto",
    description:
      "Automóvil privado sedán con aire acondicionado (máx. 4 pasajeros por vehículo). $70.000 por trayecto y por vehículo. Con 5 o más huéspedes se requieren al menos 2 vehículos.",
    priceCop: 70_000,
    pricing: "perAirportLeg",
  },
  {
    id: "pet",
    label: "Mascota",
    description:
      "Hasta 2 mascotas por loft, con autorización previa. $30.000 por cada mascota.",
    priceCop: 30_000,
    pricing: "flat",
  },
  {
    id: "breakfast",
    label: "Desayuno completo de la casa",
    description:
      "Empieza el día con energía: café o chocolate caliente, leche, huevos al gusto, pan blanco fresco y porción de arroz o fruta de temporada. Se vende por día; el máximo de días es igual al número de noches de la reserva.",
    priceCop: 15_000,
    pricing: "perGuestPerDay",
  },
  {
    id: "lunch",
    label: "Almuerzo tradicional completo",
    description:
      "Menú balanceado: sopa y principio del día, ensalada fresca, arroz, proteína a tu elección y bebida natural. Se vende por día; el máximo de días es igual al número de noches de la reserva.",
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
  /** Número de vehículos (cada uno máx. 4 pasajeros). */
  vehicles: number;
};

export type TimingExtraId = "early-checkin" | "late-checkout" | "pet";

export type TimingExtraQuantity = {
  /** Cuántos lofts / apartamentos requieren el servicio. */
  units: number;
};

/** Mínimo de vehículos según huéspedes (capacidad 4). */
export function minAirportVehicles(guests: number): number {
  const g = Math.max(1, Math.floor(guests || 1));
  return Math.max(1, Math.ceil(g / AIRPORT_VEHICLE_CAPACITY));
}

export function clampAirportVehicles(
  vehicles: number,
  guests: number,
  maxVehicles = 20,
): number {
  const min = minAirportVehicles(guests);
  return Math.min(maxVehicles, Math.max(min, Math.floor(vehicles || min)));
}

export function clampTimingUnits(
  units: number,
  lofts: number,
): number {
  const max = Math.max(1, Math.floor(lofts || 1));
  return Math.min(max, Math.max(1, Math.floor(units || max)));
}

/** Máximo de mascotas = 2 × número de lofts. */
export function maxPetsForLofts(lofts: number): number {
  return PETS_PER_LOFT * Math.max(1, Math.floor(lofts || 1));
}

export function clampPetCount(count: number, lofts: number): number {
  const max = maxPetsForLofts(lofts);
  return Math.min(max, Math.max(1, Math.floor(count || 1)));
}

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

/**
 * Máximo de días de comida vendibles = noches de la reserva
 * (p. ej. 3 noches → máx. 3 días de desayuno o almuerzo).
 */
export function mealMaxDays(noches: number): number {
  return Math.max(0, Math.floor(noches || 0));
}

export function clampMealDays(
  days: number,
  noches: number,
  minDays = 0,
): number {
  const max = mealMaxDays(noches);
  const min = Math.min(Math.max(0, minDays), max);
  return Math.min(max, Math.max(min, Math.floor(days || 0)));
}

/**
 * A partir de esta hora (America/Bogotá) el early check-in del mismo día
 * ya no se ofrece: el ingreso estándar es desde las 3:00 p.m.
 */
export const EARLY_CHECKIN_SAME_DAY_CUTOFF_HOUR = 14;

const EARLY_CHECKIN_TZ = "America/Bogota";

function bogotaCalendarParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EARLY_CHECKIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

/**
 * ¿Se ofrece early check-in para esta fecha de ingreso?
 * - Fechas futuras: sí.
 * - Mismo día (Bogotá): solo si aún no son las 2:00 p.m.
 * - Fecha pasada o vacía inválida: no (vacía → sí, hasta tener fechas).
 */
export function isEarlyCheckInOffered(
  checkInYmd: string,
  now: Date = new Date(),
): boolean {
  if (!checkInYmd || !/^\d{4}-\d{2}-\d{2}$/.test(checkInYmd)) return true;
  const { ymd: today, hour } = bogotaCalendarParts(now);
  if (checkInYmd > today) return true;
  if (checkInYmd < today) return false;
  return hour < EARLY_CHECKIN_SAME_DAY_CUTOFF_HOUR;
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
  if (extra.pricing === "perAirportLeg") {
    return `+ ${formatCopPlain(extra.priceCop)} / trayecto / vehículo`;
  }
  if (extra.id === "early-checkin" || extra.id === "late-checkout") {
    return `+ ${formatCopPlain(extra.priceCop)} / loft`;
  }
  if (extra.id === "pet") {
    return `+ ${formatCopPlain(extra.priceCop)} / mascota`;
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
  /** Unidades (lofts) para early check-in / late check-out. */
  units?: number;
  /** Cantidad de mascotas ($30.000 c/u). */
  petCount?: number;
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
      ctx?.airport ?? { pickup: false, dropoff: false, vehicles: 1 },
    );
    const vehicles = Math.max(1, Math.floor(ctx?.airport?.vehicles ?? 1));
    return extra.priceCop * legs * vehicles;
  }
  if (extra.id === "early-checkin" || extra.id === "late-checkout") {
    const units = Math.max(1, Math.floor(ctx?.units ?? 1));
    return extra.priceCop * units;
  }
  if (extra.id === "pet") {
    const count = Math.max(1, Math.floor(ctx?.petCount ?? ctx?.units ?? 1));
    return extra.priceCop * count;
  }
  return extra.priceCop;
}

export function extrasTotalCop(
  selectedIds: string[],
  mealQuantities: Partial<Record<MealExtraId, MealExtraQuantity>>,
  airportTransfer: AirportTransferChoice,
  timingQuantities?: Partial<Record<TimingExtraId, TimingExtraQuantity>>,
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
    if (extra.id === "early-checkin" || extra.id === "late-checkout") {
      ctx.units = timingQuantities?.[extra.id]?.units ?? 1;
    }
    if (extra.id === "pet") {
      ctx.petCount = timingQuantities?.pet?.units ?? 1;
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
