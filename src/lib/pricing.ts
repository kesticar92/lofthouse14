/**
 * Lógica de cotización — réplica exacta de
 * "Calculadora_Tarifas_Lofthouse.xlsx" (hojas Configuracion + Calculadora).
 *
 * Valores por defecto (editables en Admin → Configuración):
 *  - Lunes a Jueves:      80.000 COP por noche (base 1–2 huéspedes)
 *  - Viernes a Domingo:  100.000 COP por noche (base 1–2 huéspedes)
 *  - Recargo por huésped adicional (3º–5º):  30.000 COP por huésped × noche
 *  - Aseo 1–2 noches (por loft):  30.000 COP
 *  - Aseo 3–7 noches (por loft):  60.000 COP
 *  - Aseo >7 noches (por loft): ROUNDUP(noches/7) × 30.000 COP
 *  - Descuento ≥7 noches:  20 %   (sobre alojamiento + recargo huéspedes)
 *  - Descuento ≥28 noches: 40 %   (reemplaza al anterior)
 *  - Comisión Airbnb (opcional): + 12 %
 */

export type PricingConfig = {
  tarifaLJ: number;
  tarifaVD: number;
  recargoHuesped: number;
  aseoCorta: number;
  aseoMedia: number;
  aseoSemanal: number;
  descuentoSemanal: number;
  descuentoMensual: number;
  comisionAirbnb: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  tarifaLJ: 80_000,
  tarifaVD: 100_000,
  recargoHuesped: 30_000,
  aseoCorta: 30_000,
  aseoMedia: 60_000,
  aseoSemanal: 30_000,
  descuentoSemanal: 0.2,
  descuentoMensual: 0.4,
  comisionAirbnb: 0.12,
};

export type QuoteInput = {
  checkIn: string; // yyyy-mm-dd
  checkOut: string; // yyyy-mm-dd
  huespedes: number;
  lofts: number;
};

export type NightBreakdown = {
  n: number;
  date: string; // yyyy-mm-dd
  dia: string; // Lun, Mar…
  esFinDeSemana: boolean;
  tarifa: number;
};

export type QuoteResult = {
  ok: boolean;
  error?: string;
  noches: number;
  nochesLJ: number;
  nochesVD: number;
  subtotalAlojamiento: number;
  recargoHuespedes: number;
  aseoTotal: number;
  aseoDetalle: string;
  subtotalReserva: number;
  descuento: number;
  descuentoDetalle: string;
  totalReserva: number;
  totalConComisionAirbnb: number;
  comisionAirbnb: number;
  nightByNight: NightBreakdown[];
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** WEEKDAY(x,2): 1=Lun … 7=Dom. Consideramos L-J como 1..4, V-D como 5..7. */
function isoDayIndex(d: Date) {
  const js = d.getDay(); // 0=Dom…6=Sab
  return js === 0 ? 7 : js; // 1..7 con Dom=7
}

export function formatCOP(value: number) {
  const rounded = Math.round(value);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(rounded);
}

/** Parse yyyy-mm-dd en hora local (sin desfase UTC). */
function parseLocal(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function diffDays(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

export function quote(
  input: QuoteInput,
  cfg: PricingConfig = DEFAULT_PRICING,
): QuoteResult {
  const ci = parseLocal(input.checkIn);
  const co = parseLocal(input.checkOut);
  const huespedes = Math.max(0, Math.floor(input.huespedes || 0));
  const lofts = Math.max(1, Math.floor(input.lofts || 0));

  const empty: QuoteResult = {
    ok: false,
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
  };

  if (!ci || !co) return { ...empty, error: "Selecciona fechas válidas" };
  const noches = diffDays(ci, co);
  if (noches <= 0)
    return { ...empty, error: "La salida debe ser posterior al ingreso" };
  if (huespedes <= 0)
    return { ...empty, error: "Ingresa cantidad de huéspedes" };

  const nightByNight: NightBreakdown[] = [];
  let nochesLJ = 0;
  let nochesVD = 0;
  for (let i = 0; i < noches; i++) {
    const d = new Date(ci);
    d.setDate(ci.getDate() + i);
    const idx = isoDayIndex(d);
    const esFinDeSemana = idx >= 5;
    if (esFinDeSemana) nochesVD++;
    else nochesLJ++;
    nightByNight.push({
      n: i + 1,
      date: d.toISOString().slice(0, 10),
      dia: DIAS[idx - 1],
      esFinDeSemana,
      tarifa: esFinDeSemana ? cfg.tarifaVD : cfg.tarifaLJ,
    });
  }

  const subtotalAlojamiento = nochesLJ * cfg.tarifaLJ + nochesVD * cfg.tarifaVD;
  const recargoHuespedes =
    huespedes <= 2 ? 0 : (huespedes - 2) * cfg.recargoHuesped * noches;

  let aseoTotal = 0;
  let aseoDetalle = "";
  if (noches <= 2) {
    aseoTotal = cfg.aseoCorta * lofts;
    aseoDetalle = `Aseo corto (1–2 noches): ${formatCOP(
      cfg.aseoCorta,
    )} × ${lofts} loft(s)`;
  } else if (noches <= 7) {
    aseoTotal = cfg.aseoMedia * lofts;
    aseoDetalle = `Aseo medio (3–7 noches): ${formatCOP(
      cfg.aseoMedia,
    )} × ${lofts} loft(s)`;
  } else {
    const semanas = Math.ceil(noches / 7);
    aseoTotal = semanas * cfg.aseoSemanal * lofts;
    aseoDetalle = `${semanas} semana(s) × ${formatCOP(cfg.aseoSemanal)} × ${lofts} loft(s)`;
  }

  const subtotalReserva = subtotalAlojamiento + recargoHuespedes + aseoTotal;

  let descuento = 0;
  let descuentoDetalle = "Sin descuento (estadía menor a 7 noches)";
  const baseDescuento = subtotalAlojamiento + recargoHuespedes;
  if (noches >= 28) {
    descuento = -baseDescuento * cfg.descuentoMensual;
    descuentoDetalle = `Descuento mensual ${(cfg.descuentoMensual * 100).toFixed(0)}% sobre ${formatCOP(baseDescuento)}`;
  } else if (noches >= 7) {
    descuento = -baseDescuento * cfg.descuentoSemanal;
    descuentoDetalle = `Descuento semanal ${(cfg.descuentoSemanal * 100).toFixed(0)}% sobre ${formatCOP(baseDescuento)}`;
  }

  const totalReserva = subtotalReserva + descuento;
  const comisionAirbnb = totalReserva * cfg.comisionAirbnb;
  const totalConComisionAirbnb = totalReserva + comisionAirbnb;

  return {
    ok: true,
    noches,
    nochesLJ,
    nochesVD,
    subtotalAlojamiento,
    recargoHuespedes,
    aseoTotal,
    aseoDetalle,
    subtotalReserva,
    descuento,
    descuentoDetalle,
    totalReserva,
    comisionAirbnb,
    totalConComisionAirbnb,
    nightByNight,
  };
}
