import type { LoftCategoryId } from "@/data/loft-categories";

export const STAY_DRAFT_EVENT = "lofthouse:stay-draft";
export const STAY_DRAFT_STORAGE_KEY = "lofthouse_stay_draft_v1";
/** La barra sticky de cotización está visible (para subir FABs en móvil). */
export const STICKY_BOOKING_VISIBLE_EVENT = "lofthouse:sticky-booking-visible";

/** Origen de entrada al wizard `/reservar`. */
export type StayDraftFrom = "banner" | "card";

export type StayDraft = {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  /** Preferencia de categoría: Vista / Atrio / Cielo. */
  categoryId?: LoftCategoryId;
  /**
   * Origen del flujo:
   * - `banner`: fechas+huéspedes ya elegidos → siguiente paso = tipo de loft
   * - `card`: categoría ya elegida → siguiente paso = fechas (y huéspedes si faltan)
   */
  from?: StayDraftFrom;
  /**
   * Paso sugerido del configurador
   * (0 = tu viaje, 1 = fechas, 2 = huéspedes, 3 = loft, 4 = extras, 5 = confirmar).
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

/** Query string para `/reservar` a partir del draft. */
export function stayDraftToQuery(draft: StayDraft): string {
  const qs = new URLSearchParams();
  if (draft.checkIn) qs.set("check_in", draft.checkIn);
  if (draft.checkOut) qs.set("check_out", draft.checkOut);
  if (draft.guests) qs.set("guests", String(draft.guests));
  if (draft.categoryId) qs.set("category", draft.categoryId);
  if (draft.from) qs.set("from", draft.from);
  if (typeof draft.step === "number") qs.set("step", String(draft.step));
  return qs.toString();
}

export function stayDraftFromQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): StayDraft {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const guestsRaw = get("guests");
  const guests = guestsRaw ? Number(guestsRaw) : undefined;
  const fromRaw = get("from");
  const from =
    fromRaw === "banner" || fromRaw === "card" ? fromRaw : undefined;
  const category = get("category");
  const stepRaw = get("step");
  const step = stepRaw != null && stepRaw !== "" ? Number(stepRaw) : undefined;
  return {
    checkIn: get("check_in") || undefined,
    checkOut: get("check_out") || undefined,
    guests: guests && guests > 0 ? guests : undefined,
    categoryId:
      category === "vista" || category === "atrio" || category === "cielo"
        ? category
        : undefined,
    from,
    step: Number.isFinite(step) ? step : undefined,
  };
}
