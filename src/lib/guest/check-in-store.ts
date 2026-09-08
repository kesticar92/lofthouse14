/**
 * Check-in digital mínimo (stub).
 * Confirma datos + términos + ETA — sin documentos sensibles.
 */

export type DigitalCheckInPayload = {
  reservation_code: string;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  guests: number;
  /** ETA llegada (HH:mm o texto corto) */
  arrival_eta: string;
  terms_accepted: boolean;
  data_confirmed: boolean;
  notes?: string;
  completed_at: string;
};

const g = globalThis as unknown as {
  __lhDigitalCheckIns?: Map<string, DigitalCheckInPayload>;
};

function store() {
  if (!g.__lhDigitalCheckIns) g.__lhDigitalCheckIns = new Map();
  return g.__lhDigitalCheckIns;
}

export function checkInStorageKey(code: string): string {
  return `lh14:checkin:${code.trim().toUpperCase()}`;
}

export function saveDigitalCheckIn(
  payload: DigitalCheckInPayload,
): { ok: true; checkIn: DigitalCheckInPayload } | { ok: false; error: string } {
  const code = payload.reservation_code?.trim().toUpperCase();
  if (!code) return { ok: false, error: "Código requerido" };
  if (!payload.data_confirmed) {
    return { ok: false, error: "Debes confirmar tus datos" };
  }
  if (!payload.terms_accepted) {
    return { ok: false, error: "Debes aceptar los términos de hospedaje" };
  }
  if (!payload.arrival_eta?.trim()) {
    return { ok: false, error: "Indica tu hora estimada de llegada" };
  }

  const row: DigitalCheckInPayload = {
    ...payload,
    reservation_code: code,
    guest_name: payload.guest_name.trim() || "Huésped",
    arrival_eta: payload.arrival_eta.trim(),
    notes: (payload.notes ?? "").trim().slice(0, 500),
    completed_at: payload.completed_at || new Date().toISOString(),
  };
  store().set(code, row);
  return { ok: true, checkIn: row };
}

export function getDigitalCheckIn(
  code: string,
): DigitalCheckInPayload | null {
  return store().get(code.trim().toUpperCase()) ?? null;
}

export function listDigitalCheckIns(): DigitalCheckInPayload[] {
  return [...store().values()];
}

export function resetDigitalCheckIns() {
  g.__lhDigitalCheckIns = new Map();
}

/** Persistencia browser (complementa el stub server). */
export function saveCheckInLocalBrowser(payload: DigitalCheckInPayload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      checkInStorageKey(payload.reservation_code),
      JSON.stringify(payload),
    );
  } catch {
    /* quota / private mode */
  }
}

export function readCheckInLocalBrowser(
  code: string,
): DigitalCheckInPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(checkInStorageKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as DigitalCheckInPayload;
  } catch {
    return null;
  }
}
