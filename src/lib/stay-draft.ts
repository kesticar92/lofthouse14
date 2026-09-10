import type { LoftCategoryId } from "@/data/loft-categories";

export const STAY_DRAFT_EVENT = "lofthouse:stay-draft";
export const STAY_DRAFT_STORAGE_KEY = "lofthouse_stay_draft_v1";
/** La barra sticky de cotización está visible (para subir FABs en móvil). */
export const STICKY_BOOKING_VISIBLE_EVENT = "lofthouse:sticky-booking-visible";

export type StayDraft = {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  /** Preferencia de categoría: Vista / Atrio / Cielo. */
  categoryId?: LoftCategoryId;
  /**
   * Paso sugerido del configurador
   * (0 = tu viaje, 1 = fechas, 2 = huéspedes, 3 = extras, 4 = confirmar).
   * Con fechas+huéspedes o categoryId, el wizard puede saltar Tu viaje.
   */
  step?: number;
};

export function saveStayDraft(draft: StayDraft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STAY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(
    new CustomEvent(STAY_DRAFT_EVENT, {
      detail: draft,
    }),
  );
}

/** Fusiona con el borrador existente (p. ej. fechas del banner + categoría de la card). */
export function mergeStayDraft(patch: StayDraft) {
  const prev = readStayDraft() ?? {};
  saveStayDraft({ ...prev, ...patch });
}

export function readStayDraft(): StayDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STAY_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StayDraft;
  } catch {
    return null;
  }
}

export function clearStayDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STAY_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
