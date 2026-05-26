"use client";

/**
 * localStorage: solo preferencias no críticas y respaldos legacy.
 * Datos operativos (cotizaciones, inventario, tarifas, PMS, gastos) → Supabase vía API.
 */

const PREFIX = "lofthouse14.";

export const KEYS = {
  pricing: PREFIX + "pricing.config",
  cotizaciones: PREFIX + "cotizaciones",
  inventarios: PREFIX + "inventarios",
  aseos: PREFIX + "aseos",
  /** Obsoleto: la sesión admin pasó a cookie httpOnly; se limpia al iniciar sesión de nuevo. */
  auth: PREFIX + "auth",
} as const;

export function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** @returns false si no hay ventana o localStorage no permite escribir (cuota, modo privado, etc.) */
export function safeSet<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

/** Exporta todos los datos del panel como un único JSON descargable. */
export function exportAll() {
  if (typeof window === "undefined") return;
  const payload: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    const raw = window.localStorage.getItem(key);
    if (raw) payload[key] = JSON.parse(raw);
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `lofthouse14-respaldo-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importAllFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Record<
          string,
          unknown
        >;
        for (const key of Object.values(KEYS)) {
          if (key in data) {
            window.localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
