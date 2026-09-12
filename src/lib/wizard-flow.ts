import type { StayDraft, StayDraftFrom } from "@/lib/stay-draft";

export const WIZARD_STEPS = [
  "Tu viaje",
  "Fechas",
  "Huéspedes",
  "Loft",
  "Extras",
  "Confirmar",
] as const;

export const STEP_TU_VIAJE = 0;
export const STEP_FECHAS = 1;
export const STEP_HUESPEDES = 2;
export const STEP_LOFT = 3;
export const STEP_EXTRAS = 4;
export const STEP_CONFIRMAR = 5;

export type WizardFlowFlags = {
  /** Fechas+huéspedes ya cubiertos (banner o completados en wizard). */
  skipStaySteps: boolean;
  /** No pedir «Tu viaje». */
  skipTripStep: boolean;
  /** Categoría ya elegida (card) → no reabrir Loft. */
  skipLoftStep: boolean;
  /** Estado actual (draft o React) para no re-preguntar. */
  hasDates?: boolean;
  hasGuests?: boolean;
  hasCategory?: boolean;
};

export function draftHasValidDates(draft: Pick<StayDraft, "checkIn" | "checkOut">) {
  return Boolean(
    draft.checkIn && draft.checkOut && draft.checkOut > draft.checkIn,
  );
}

export function stayReadyFrom(draft: Pick<StayDraft, "checkIn" | "checkOut" | "guests">) {
  return (
    draftHasValidDates(draft) && Boolean(draft.guests && draft.guests > 0)
  );
}

/**
 * Paso inicial según origen:
 * - banner (fechas+huéspedes): → Loft (o Extras si ya hay categoría)
 * - card (categoría): → Fechas / Huéspedes / Extras (nunca Loft)
 * Nunca reabrir Fechas/Huéspedes si ya están en el draft.
 */
export function resolveEntryStep(draft: StayDraft): number {
  const hasDates = draftHasValidDates(draft);
  const hasGuests = Boolean(draft.guests && draft.guests > 0);
  const stayReady = hasDates && hasGuests;
  const hasCategory = Boolean(draft.categoryId);
  const from: StayDraftFrom | undefined =
    draft.from ??
    (hasCategory ? "card" : stayReady ? "banner" : undefined);

  const skipTrip = Boolean(from) || stayReady || hasCategory;

  let next =
    typeof draft.step === "number"
      ? Math.min(WIZARD_STEPS.length - 1, Math.max(0, draft.step))
      : STEP_TU_VIAJE;

  if (from === "banner") {
    // Fechas+huéspedes del banner → loft; si ya hay loft → extras.
    if (stayReady && hasCategory) next = STEP_EXTRAS;
    else if (stayReady) next = STEP_LOFT;
    else if (hasDates) next = STEP_HUESPEDES;
    else next = STEP_FECHAS;
  } else if (from === "card") {
    // Categoría de la card → fechas (y huéspedes si faltan); luego extras.
    if (stayReady) next = STEP_EXTRAS;
    else if (hasDates) next = STEP_HUESPEDES;
    else next = STEP_FECHAS;
  } else if (skipTrip && next === STEP_TU_VIAJE) {
    if (stayReady && hasCategory) next = STEP_EXTRAS;
    else if (stayReady) next = STEP_LOFT;
    else if (hasDates) next = STEP_HUESPEDES;
    else next = STEP_FECHAS;
  }

  // Banner nunca debe saltar a Extras sin categoría.
  if (from === "banner" && !hasCategory && next >= STEP_EXTRAS) {
    next = STEP_LOFT;
  }
  // Card nunca debe abrir el paso Loft (categoría ya elegida).
  if (from === "card" && hasCategory && next === STEP_LOFT) {
    next = stayReady ? STEP_EXTRAS : hasDates ? STEP_HUESPEDES : STEP_FECHAS;
  }
  // Sin estadía completa no abrir Extras.
  if (!stayReady && next >= STEP_EXTRAS) {
    next = hasDates ? STEP_HUESPEDES : STEP_FECHAS;
  }
  // Con estadía+categoría no quedarse en Fechas/Huéspedes/Loft.
  if (stayReady && hasCategory && next < STEP_EXTRAS && next !== STEP_TU_VIAJE) {
    if (from === "card" || next === STEP_LOFT || next === STEP_FECHAS || next === STEP_HUESPEDES) {
      next = STEP_EXTRAS;
    }
  }
  return next;
}

/**
 * Tras elegir loft: si fechas+huéspedes ya están, ir a Extras (no repetir).
 */
export function stepAfterSelectingLoft(flags: {
  hasDates: boolean;
  hasGuests: boolean;
}): number {
  if (flags.hasDates && flags.hasGuests) return STEP_EXTRAS;
  if (flags.hasDates) return STEP_HUESPEDES;
  return STEP_FECHAS;
}

export function nextLogicalStep(from: number, flags: WizardFlowFlags): number {
  const stayDone =
    flags.skipStaySteps ||
    Boolean(flags.hasDates && flags.hasGuests);
  const loftDone = flags.skipLoftStep || Boolean(flags.hasCategory);

  if (from === STEP_TU_VIAJE) {
    if (stayDone) return loftDone ? STEP_EXTRAS : STEP_LOFT;
    if (flags.hasDates) return STEP_HUESPEDES;
    return STEP_FECHAS;
  }
  if (from === STEP_FECHAS) {
    // No repetir huéspedes si ya están en draft/state.
    if (flags.skipStaySteps || flags.hasGuests) {
      return loftDone ? STEP_EXTRAS : STEP_LOFT;
    }
    return STEP_HUESPEDES;
  }
  if (from === STEP_HUESPEDES) {
    return loftDone ? STEP_EXTRAS : STEP_LOFT;
  }
  // Tras loft: siempre Extras (fechas/huéspedes ya quedaron atrás).
  if (from === STEP_LOFT) return STEP_EXTRAS;
  if (from === STEP_EXTRAS) return STEP_CONFIRMAR;
  return from;
}

/**
 * Atrás siempre recorre el orden canónico para poder reconfigurar,
 * aunque se haya llegado por un atajo (banner/card) sin pasar por ese paso.
 * Los flags de skip solo afectan el avance y la entrada, no el retroceso.
 */
export function prevLogicalStep(
  from: number,
  _flags?: WizardFlowFlags,
): number | null {
  if (from === STEP_CONFIRMAR) return STEP_EXTRAS;
  if (from === STEP_EXTRAS) return STEP_LOFT;
  if (from === STEP_LOFT) return STEP_HUESPEDES;
  if (from === STEP_HUESPEDES) return STEP_FECHAS;
  if (from === STEP_FECHAS) return STEP_TU_VIAJE;
  return null;
}
