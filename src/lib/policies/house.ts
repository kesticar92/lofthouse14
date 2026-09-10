/**
 * Políticas operativas de la casa (depósito de daños, aseo, duración máxima).
 * Fuente canónica para copy en /politicas y para el motor de cotización.
 */

export const MAX_STAY_NIGHTS = 30;

/** Depósito de daños por loft (retenido / reembolsable según estado al check-out). */
export const DAMAGE_DEPOSIT_SHORT_COP = 200_000; // reservas < 7 días
export const DAMAGE_DEPOSIT_LONG_COP = 500_000; // reservas ≥ 7 días

/** Aseo por loft — montos por defecto (coinciden con DEFAULT_PRICING). */
export const ASEO_CORTA_COP = 30_000; // 1–2 noches
export const ASEO_ESTANDAR_COP = 60_000; // a partir de 4 noches (≥4)
export const ASEO_SEMANAL_EXTRA_COP = 30_000; // adicional, una vez por semana si >7 días

/**
 * Depósito de daños por loft según duración de la reserva.
 * < 7 días → $200.000; ≥ 7 días → $500.000.
 */
export function damageDepositPerLoftCop(noches: number): number {
  if (noches < 1) return 0;
  return noches < 7 ? DAMAGE_DEPOSIT_SHORT_COP : DAMAGE_DEPOSIT_LONG_COP;
}

export function damageDepositTotalCop(noches: number, lofts: number): number {
  const n = Math.max(0, Math.floor(noches));
  const l = Math.max(1, Math.floor(lofts || 1));
  return damageDepositPerLoftCop(n) * l;
}

/**
 * Semanas de aseo adicional para estadías de más de 7 días.
 * Una vez por semana: floor(noches/7) cobros de aseo semanal extra.
 */
export function aseoSemanasExtra(noches: number): number {
  if (noches <= 7) return 0;
  return Math.floor(noches / 7);
}

export type AseoBreakdown = {
  basePerLoft: number;
  semanasExtra: number;
  semanalPerLoft: number;
  totalPerLoft: number;
  total: number;
  detalle: string;
};

/**
 * Reglas de aseo (por loft):
 * - 1–2 noches: $30.000
 * - A partir de 4 noches (≥4): $60.000
 * - 3 noches: mismo tramo corto ($30.000); no es «a partir de 4»
 * - Más de 7 días (>7 noches): $60.000 + $30.000 × floor(noches/7) adicionales
 */
export function computeAseo(params: {
  noches: number;
  lofts: number;
  aseoCorta?: number;
  aseoMedia?: number;
  aseoSemanal?: number;
  formatMoney?: (n: number) => string;
}): AseoBreakdown {
  const noches = Math.max(0, Math.floor(params.noches));
  const lofts = Math.max(1, Math.floor(params.lofts || 1));
  const corta = params.aseoCorta ?? ASEO_CORTA_COP;
  const media = params.aseoMedia ?? ASEO_ESTANDAR_COP;
  const semanal = params.aseoSemanal ?? ASEO_SEMANAL_EXTRA_COP;
  const fmt =
    params.formatMoney ??
    ((n: number) =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Math.round(n)));

  if (noches <= 0) {
    return {
      basePerLoft: 0,
      semanasExtra: 0,
      semanalPerLoft: 0,
      totalPerLoft: 0,
      total: 0,
      detalle: "",
    };
  }

  if (noches < 4) {
    // 1–2 noches (y 3 noches: fuera del tramo «a partir de 4») → aseo corto
    const basePerLoft = corta;
    const total = basePerLoft * lofts;
    const rango = noches <= 2 ? "1–2 noches" : "3 noches";
    return {
      basePerLoft,
      semanasExtra: 0,
      semanalPerLoft: 0,
      totalPerLoft: basePerLoft,
      total,
      detalle: `Aseo (${rango}): ${fmt(basePerLoft)} × ${lofts} loft(s)`,
    };
  }

  // ≥4 noches: aseo estándar $60.000
  const basePerLoft = media;
  const semanasExtra = aseoSemanasExtra(noches);
  const semanalPerLoft = semanasExtra * semanal;
  const totalPerLoft = basePerLoft + semanalPerLoft;
  const total = totalPerLoft * lofts;

  if (semanasExtra > 0) {
    return {
      basePerLoft,
      semanasExtra,
      semanalPerLoft,
      totalPerLoft,
      total,
      detalle: `Aseo estándar (≥4 noches): ${fmt(basePerLoft)} + aseo semanal extra (${semanasExtra}× ${fmt(semanal)}) = ${fmt(totalPerLoft)} × ${lofts} loft(s)`,
    };
  }

  return {
    basePerLoft,
    semanasExtra: 0,
    semanalPerLoft: 0,
    totalPerLoft: basePerLoft,
    total,
    detalle: `Aseo estándar (a partir de 4 noches): ${fmt(basePerLoft)} × ${lofts} loft(s)`,
  };
}
