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
  /** Paso sugerido del configurador (1 = fechas). */
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
