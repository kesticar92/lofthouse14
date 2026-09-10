/**
 * Categorías comerciales de lofts (precio y tipo de ventana).
 * Números de loft y capacidades se alinean con el catálogo seed
 * (`src/lib/catalog/seed.ts` ↔ migraciones 019/020).
 * - Vista: ventana exterior (1, 14)
 * - Atrio: ventana interior / patio (5, 7, 8) — loft 5 máx. 3 huéspedes
 * - Cielo: lofts cerrados (sin ventana a calle/atrio)
 *
 * Fotos del carrusel: inspeccionadas en `/public/gallery` (ventana / cortina /
 * claraboya · cocina · baño o escaleras). Overrides admin en `.data/lofts-marketing.json`.
 */

import {
  loftNumbersForCategory,
  maxGuestsOverridesForCategory,
  type MarketingCategory,
} from "@/lib/catalog/seed";

export type LoftCategoryId = MarketingCategory;

export type LoftCategoryTheme = "vista" | "atrio" | "cielo";

export type LoftCategory = {
  id: LoftCategoryId;
  name: string;
  shortLabel: string;
  tagline: string;
  /** Etiqueta de vista para el ticket (ej. "Ciudad"). */
  vistaLabel: string;
  /** Descripción corta de camas. */
  bedsLabel: string;
  /** Comodidades mostradas en el ticket. */
  amenities: string[];
  windowKind: "exterior" | "interior" | "cerrado";
  loftNumbers: number[];
  /** Precio desde (COP / noche, temporada baja, 1–2 huéspedes). */
  priceFromCop: number;
  /** Capacidad máxima entre las unidades de la categoría. */
  maxGuests: number;
  /** Capacidad por número de loft (si difiere del default 5). */
  maxGuestsByLoft: Partial<Record<number, number>>;
  stubCode: string;
  /** Portada (primera del carrusel). */
  image: string;
  /** Carrusel de fotos reales (autoplay en cards hero). */
  images: string[];
  imageAlt: string;
  theme: LoftCategoryTheme;
};

const COMMON_AMENITIES = [
  "Aire acondicionado",
  "Cocina Equipada",
  "Smart TV con ROKU",
  "Baño",
  "WiFi",
  "Smart Entry",
];

/** Fotos por tipología — orden: rasgo distintivo → cocina → baño/escaleras. */
const VISTA_IMAGES = [
  // Cama + ventana al exterior + TV (foto primaria card Vista)
  "/gallery/cuarto_2.webp",
  // Cocina detallada
  "/gallery/immersive/02-cocina_derecha.webp",
  // Baño
  "/gallery/immersive/32-bano-privado-loft-cali.webp",
] as const;

const ATRIO_IMAGES = [
  // Cortina cerrada (no abiertas)
  "/gallery/immersive/42-loft-interior-moderno-cali.webp",
  // Cocina detallada
  "/gallery/immersive/01-cocina_completa_comedor_escalera_izquierda.webp",
  // Escaleras
  "/gallery/immersive/07-escalera_5.webp",
] as const;

const CIELO_IMAGES = [
  // Luz clara entre 1er y 2º piso (claraboya / doble altura)
  "/gallery/immersive/44-loft-espacio-estadia-cali.webp",
    // Cocina detallada
    "/gallery/cocina_3.webp",
    // Baño
    "/gallery/immersive/48-bano-privado-lofthouse-14.webp",
] as const;

export const LOFT_CATEGORIES: LoftCategory[] = [
  {
    id: "vista",
    name: "Loft Vista",
    shortLabel: "Vista",
    tagline: "Ventana exterior · luz de barrio",
    vistaLabel: "Ciudad",
    bedsLabel: "1 Cama Doble + 3 Sofacamas",
    amenities: [...COMMON_AMENITIES],
    windowKind: "exterior",
    loftNumbers: loftNumbersForCategory("vista"),
    priceFromCop: 120_000,
    maxGuests: 5,
    maxGuestsByLoft: maxGuestsOverridesForCategory("vista"),
    stubCode: "VIS",
    image: VISTA_IMAGES[0],
    images: [...VISTA_IMAGES],
    imageAlt:
      "Loft Vista: cama doble, ventana al exterior y TV en Miraflores, Cali",
    theme: "vista",
  },
  {
    id: "atrio",
    name: "Loft Atrio",
    shortLabel: "Atrio",
    tagline: "Ventana interior · patio del conjunto",
    vistaLabel: "Patio Interior",
    bedsLabel: "1 Cama Doble + 3 Sofacamas",
    amenities: [...COMMON_AMENITIES],
    windowKind: "interior",
    loftNumbers: loftNumbersForCategory("atrio"),
    priceFromCop: 105_000,
    maxGuests: 5,
    maxGuestsByLoft: maxGuestsOverridesForCategory("atrio"),
    stubCode: "ATR",
    image: ATRIO_IMAGES[0],
    images: [...ATRIO_IMAGES],
    imageAlt:
      "Loft Atrio: habitación con cortina cerrada y ambiente de patio interior",
    theme: "atrio",
  },
  {
    id: "cielo",
    name: "Loft Cielo",
    shortLabel: "Cielo",
    tagline: "Loft cerrado · intimidad total",
    vistaLabel: "Claraboya al Cielo",
    bedsLabel: "1 Cama Doble + 3 Sofacamas",
    amenities: [...COMMON_AMENITIES],
    windowKind: "cerrado",
    loftNumbers: loftNumbersForCategory("cielo"),
    priceFromCop: 90_000,
    maxGuests: 5,
    maxGuestsByLoft: maxGuestsOverridesForCategory("cielo"),
    stubCode: "CIE",
    image: CIELO_IMAGES[0],
    images: [...CIELO_IMAGES],
    imageAlt:
      "Loft Cielo: doble altura con luz clara entre primer y segundo piso",
    theme: "cielo",
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

/** Aplica overrides de marketing (fotos / amenities) sobre el seed. */
export function applyLoftMarketingOverrides(
  categories: LoftCategory[],
  overrides: Partial<
    Record<
      LoftCategoryId,
      { images?: string[]; amenities?: string[] }
    >
  > | null | undefined,
): LoftCategory[] {
  if (!overrides) return categories.map((c) => ({ ...c, images: [...c.images], amenities: [...c.amenities] }));
  return categories.map((cat) => {
    const patch = overrides[cat.id];
    if (!patch) {
      return { ...cat, images: [...cat.images], amenities: [...cat.amenities] };
    }
    const images =
      patch.images && patch.images.length > 0
        ? [...patch.images]
        : [...cat.images];
    const amenities =
      patch.amenities && patch.amenities.length > 0
        ? [...patch.amenities]
        : [...cat.amenities];
    return {
      ...cat,
      images,
      image: images[0] ?? cat.image,
      amenities,
    };
  });
}
