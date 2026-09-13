/**
 * Orden y pool de lofts candidatos según categoría + huéspedes.
 *
 * Reglas Atrio (lofts 5, 7, 8):
 * - Loft 5: máx. 3 huéspedes.
 * - Con más de 3 huéspedes: priorizar 7 y 8.
 * - Solo con 11–13 huéspedes se incluye de nuevo el loft 5
 *   (capacidad conjunta 7+8+5 = 13).
 */

import {
  CATALOG_ROOMS,
  type MarketingCategory,
} from "@/lib/catalog/seed";

export type LoftCandidate = {
  unitNumber: number;
  maxGuests: number;
  code: string;
  category: MarketingCategory;
};

const ATRIO_PRIMARY = [7, 8] as const;
const ATRIO_SMALL = 5;

function roomMeta(unitNumber: number): LoftCandidate | null {
  const r = CATALOG_ROOMS.find(
    (x) => x.unit_number === unitNumber && x.status === "active",
  );
  if (!r || !r.marketing_category) return null;
  return {
    unitNumber: r.unit_number,
    maxGuests: r.max_guests,
    code: r.code,
    category: r.marketing_category,
  };
}

/**
 * Lofts a considerar (y en qué orden) para una categoría y tamaño de grupo.
 */
export function candidateLoftsForCategory(
  category: MarketingCategory,
  guests: number,
): LoftCandidate[] {
  const g = Math.max(1, Math.floor(guests) || 1);

  if (category === "atrio") {
    let nums: number[];
    if (g <= 3) {
      // Cabe en loft 5, pero preferimos 7/8 primero.
      nums = [...ATRIO_PRIMARY, ATRIO_SMALL];
    } else if (g <= 10) {
      // No usar loft 5: solo 7 y 8.
      nums = [...ATRIO_PRIMARY];
    } else if (g <= 13) {
      // Grupo grande: 7 + 8 + 5 (capacidad conjunta 13).
      nums = [...ATRIO_PRIMARY, ATRIO_SMALL];
    } else {
      // Más allá de la capacidad Atrio (13).
      return [];
    }
    return nums
      .map(roomMeta)
      .filter((x): x is LoftCandidate => Boolean(x));
  }

  // Vista / Cielo: todas las unidades activas del tipo, mayor capacidad primero.
  return CATALOG_ROOMS.filter(
    (r) =>
      r.marketing_category === category &&
      r.status === "active" &&
      r.max_guests >= 1,
  )
    .map((r) => ({
      unitNumber: r.unit_number,
      maxGuests: r.max_guests,
      code: r.code,
      category,
    }))
    .sort((a, b) => b.maxGuests - a.maxGuests || a.unitNumber - b.unitNumber);
}

/** Capacidad total del pool candidato. */
export function poolCapacity(candidates: LoftCandidate[]): number {
  return candidates.reduce((s, c) => s + c.maxGuests, 0);
}

/**
 * Elige un subconjunto mínimo de unidades libres que cubra `guests`,
 * respetando el orden de prioridad del pool.
 */
export function pickUnitsForGuests(
  freeCandidates: LoftCandidate[],
  guests: number,
): LoftCandidate[] | null {
  const g = Math.max(1, Math.floor(guests) || 1);
  if (poolCapacity(freeCandidates) < g) return null;

  // Caso 1 unidad: la primera que quepa sola (respeta prioridad).
  const alone = freeCandidates.find((c) => c.maxGuests >= g);
  if (alone) return [alone];

  // Multi-unidad: greedy en orden de prioridad hasta cubrir capacidad.
  const picked: LoftCandidate[] = [];
  let sum = 0;
  for (const c of freeCandidates) {
    picked.push(c);
    sum += c.maxGuests;
    if (sum >= g) return picked;
  }
  return null;
}

/** Categorías ordenadas de más cara a más barata (Vista → Atrio → Cielo). */
export const CATEGORIES_BY_PRICE_DESC: MarketingCategory[] = [
  "vista",
  "atrio",
  "cielo",
];

/**
 * Alternativas a ofrecer si el tipo pedido no tiene cupo.
 * Más caro primero (excluye el tipo ya pedido).
 */
export function alternativeCategories(
  preferred: MarketingCategory,
): MarketingCategory[] {
  return CATEGORIES_BY_PRICE_DESC.filter((c) => c !== preferred);
}
