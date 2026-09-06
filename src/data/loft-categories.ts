/**
 * Categorías comerciales de lofts (precio y tipo de ventana).
 * - Vista: ventana exterior (1, 14)
 * - Atrio: ventana interior / patio (5, 7, 8) — loft 5 máx. 3 huéspedes
 * - Cielo: lofts cerrados (sin ventana a calle/atrio)
 */

export type LoftCategoryId = "vista" | "atrio" | "cielo";

export type LoftCategory = {
  id: LoftCategoryId;
  name: string;
  shortLabel: string;
  tagline: string;
  windowKind: "exterior" | "interior" | "cerrado";
  loftNumbers: number[];
  /** Precio desde (COP / noche, temporada baja, 1–2 huéspedes). */
  priceFromCop: number;
  /** Capacidad máxima entre las unidades de la categoría. */
  maxGuests: number;
  /** Capacidad por número de loft (si difiere del default 5). */
  maxGuestsByLoft: Partial<Record<number, number>>;
  stubCode: string;
  image: string;
  imageAlt: string;
};

export const LOFT_CATEGORIES: LoftCategory[] = [
  {
    id: "vista",
    name: "Loft Vista",
    shortLabel: "Vista",
    tagline: "Ventana exterior · luz de barrio",
    windowKind: "exterior",
    loftNumbers: [1, 14],
    priceFromCop: 120_000,
    maxGuests: 5,
    maxGuestsByLoft: {},
    stubCode: "VIS",
    image: "/gallery/immersive/09-fachada_diurna.webp",
    imageAlt: "Fachada con luz natural — Loft Vista",
  },
  {
    id: "atrio",
    name: "Loft Atrio",
    shortLabel: "Atrio",
    tagline: "Ventana interior · patio del conjunto",
    windowKind: "interior",
    loftNumbers: [5, 7, 8],
    priceFromCop: 105_000,
    maxGuests: 5,
    maxGuestsByLoft: { 5: 3 },
    stubCode: "ATR",
    image: "/gallery/loft-sala-sofa-miraflores-cali.webp",
    imageAlt: "Interior luminoso — Loft Atrio",
  },
  {
    id: "cielo",
    name: "Loft Cielo",
    shortLabel: "Cielo",
    tagline: "Loft cerrado · intimidad total",
    windowKind: "cerrado",
    loftNumbers: [2, 3, 6, 9, 10, 11, 12, 13],
    priceFromCop: 90_000,
    maxGuests: 5,
    maxGuestsByLoft: {},
    stubCode: "CIE",
    image: "/gallery/loft-habitacion-miraflores-cali.webp",
    imageAlt: "Habitación íntima — Loft Cielo",
  },
];

export function getLoftCategory(id: LoftCategoryId): LoftCategory {
  return LOFT_CATEGORIES.find((c) => c.id === id)!;
}

export function categoryForLoftNumber(n: number): LoftCategory | undefined {
  return LOFT_CATEGORIES.find((c) => c.loftNumbers.includes(n));
}

export function maxGuestsForLoftNumber(n: number): number {
  const cat = categoryForLoftNumber(n);
  if (!cat) return 5;
  return cat.maxGuestsByLoft[n] ?? 5;
}

export function priceForLoftNumber(n: number): number {
  return categoryForLoftNumber(n)?.priceFromCop ?? 90_000;
}

/**
 * Unidades de una categoría aptas para `guests`.
 * Si el grupo supera 5 personas, se necesitan varios lofts: se listan todas
 * las unidades de la categoría (preferencia de tipo). Si cabe en un loft,
 * se excluyen las que no alcanzan (p. ej. loft 5 con máx. 3).
 */
export function availableLoftsForGuests(
  category: LoftCategory,
  guests: number,
): number[] {
  if (guests > 5) return [...category.loftNumbers];
  return category.loftNumbers.filter(
    (n) => (category.maxGuestsByLoft[n] ?? 5) >= guests,
  );
}

export function categoryFitsGuests(
  category: LoftCategory,
  guests: number,
): boolean {
  return availableLoftsForGuests(category, guests).length > 0;
}
