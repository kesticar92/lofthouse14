/**
 * Seed canónico del catálogo LOFTHOUSE (Fase 1–2).
 * Debe coincidir con supabase/migrations/019 (+ bridge 020).
 * Marketing (`loft-categories`) y admin local leen de aquí.
 */

import {
  LOFTHOUSE_ORGANIZATION_ID,
  LOFTHOUSE_ORGANIZATION_SLUG,
  LOFTHOUSE_PROPERTY_ID,
  LOFTHOUSE_PROPERTY_SLUG,
} from "@/lib/tenant/constants";

export type MarketingCategory = "vista" | "atrio" | "cielo";

export type RoomStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "storage"
  | "out_of_service";

export type CatalogRoomTypeSeed = {
  id: string;
  code: MarketingCategory;
  name: string;
  marketing_category: MarketingCategory;
  short_label: string;
  tagline: string;
  max_guests: number;
  sort_order: number;
};

export type CatalogRoomSeed = {
  unit_number: number;
  code: string;
  name: string;
  marketing_category: MarketingCategory | null;
  max_guests: number;
  status: RoomStatus;
};

export const ROOM_TYPE_IDS = {
  vista: "33333333-3333-4333-8333-333333333301",
  atrio: "33333333-3333-4333-8333-333333333302",
  cielo: "33333333-3333-4333-8333-333333333303",
} as const satisfies Record<MarketingCategory, string>;

export const CATALOG_ROOM_TYPES: CatalogRoomTypeSeed[] = [
  {
    id: ROOM_TYPE_IDS.vista,
    code: "vista",
    name: "Loft Vista",
    marketing_category: "vista",
    short_label: "Vista",
    tagline: "Ventana exterior · luz de barrio",
    max_guests: 5,
    sort_order: 1,
  },
  {
    id: ROOM_TYPE_IDS.atrio,
    code: "atrio",
    name: "Loft Atrio",
    marketing_category: "atrio",
    short_label: "Atrio",
    tagline: "Ventana interior · patio del conjunto",
    max_guests: 5,
    sort_order: 2,
  },
  {
    id: ROOM_TYPE_IDS.cielo,
    code: "cielo",
    name: "Loft Cielo",
    marketing_category: "cielo",
    short_label: "Cielo",
    tagline: "Loft cerrado · intimidad total",
    max_guests: 5,
    sort_order: 3,
  },
];

/** LOFT 01–14 (04 = bodega). Alineado con marketing Vista/Atrio/Cielo. */
export const CATALOG_ROOMS: CatalogRoomSeed[] = [
  {
    unit_number: 1,
    code: "LOFT 01",
    name: "Loft 1",
    marketing_category: "vista",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 2,
    code: "LOFT 02",
    name: "Loft 2",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 3,
    code: "LOFT 03",
    name: "Loft 3",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 4,
    code: "LOFT 04",
    name: "Loft 4 — Bodega",
    marketing_category: null,
    max_guests: 1,
    status: "storage",
  },
  {
    unit_number: 5,
    code: "LOFT 05",
    name: "Loft 5",
    marketing_category: "atrio",
    max_guests: 3,
    status: "active",
  },
  {
    unit_number: 6,
    code: "LOFT 06",
    name: "Loft 6",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 7,
    code: "LOFT 07",
    name: "Loft 7",
    marketing_category: "atrio",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 8,
    code: "LOFT 08",
    name: "Loft 8",
    marketing_category: "atrio",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 9,
    code: "LOFT 09",
    name: "Loft 9",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 10,
    code: "LOFT 10",
    name: "Loft 10",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 11,
    code: "LOFT 11",
    name: "Loft 11",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 12,
    code: "LOFT 12",
    name: "Loft 12",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 13,
    code: "LOFT 13",
    name: "Loft 13",
    marketing_category: "cielo",
    max_guests: 5,
    status: "active",
  },
  {
    unit_number: 14,
    code: "LOFT 14",
    name: "Loft 14",
    marketing_category: "vista",
    max_guests: 5,
    status: "active",
  },
];

export function loftNumbersForCategory(
  category: MarketingCategory,
): number[] {
  return CATALOG_ROOMS.filter(
    (r) => r.marketing_category === category && r.status !== "storage",
  ).map((r) => r.unit_number);
}

export function maxGuestsOverridesForCategory(
  category: MarketingCategory,
): Partial<Record<number, number>> {
  const out: Partial<Record<number, number>> = {};
  for (const r of CATALOG_ROOMS) {
    if (r.marketing_category !== category || r.status === "storage") continue;
    if (r.max_guests !== 5) out[r.unit_number] = r.max_guests;
  }
  return out;
}

export type SeedCatalogPayload = {
  organization_id: string;
  organization: {
    id: string;
    slug: string;
    name: string;
  };
  properties: Array<{
    id: string;
    organization_id: string;
    name: string;
    slug: string;
    timezone: string;
    address: string;
    city: string;
    country: string;
    status: string;
    created_at: string | null;
    updated_at: string | null;
  }>;
  room_types: Array<{
    id: string;
    organization_id: string;
    property_id: string;
    code: string;
    name: string;
    marketing_category: MarketingCategory;
    short_label: string;
    tagline: string;
    max_guests: number;
    sort_order: number;
    created_at: string | null;
    updated_at: string | null;
  }>;
  rooms: Array<{
    id: string;
    organization_id: string;
    property_id: string;
    room_type_id: string | null;
    code: string;
    unit_number: number;
    name: string;
    max_guests: number;
    status: RoomStatus;
    legacy_property_id: string | null;
    created_at: string | null;
    updated_at: string | null;
  }>;
  source: "seed";
};

/** Catálogo local (sin Supabase / tablas aún no migradas). */
export function buildSeedCatalog(): SeedCatalogPayload {
  const orgId = LOFTHOUSE_ORGANIZATION_ID;
  const propertyId = LOFTHOUSE_PROPERTY_ID;

  return {
    organization_id: orgId,
    organization: {
      id: orgId,
      slug: LOFTHOUSE_ORGANIZATION_SLUG,
      name: "LOFTHOUSE",
    },
    properties: [
      {
        id: propertyId,
        organization_id: orgId,
        name: "LOFTHOUSE 14",
        slug: LOFTHOUSE_PROPERTY_SLUG,
        timezone: "America/Bogota",
        address: "Miraflores, Cali",
        city: "Cali",
        country: "CO",
        status: "active",
        created_at: null,
        updated_at: null,
      },
    ],
    room_types: CATALOG_ROOM_TYPES.map((rt) => ({
      id: rt.id,
      organization_id: orgId,
      property_id: propertyId,
      code: rt.code,
      name: rt.name,
      marketing_category: rt.marketing_category,
      short_label: rt.short_label,
      tagline: rt.tagline,
      max_guests: rt.max_guests,
      sort_order: rt.sort_order,
      created_at: null,
      updated_at: null,
    })),
    rooms: CATALOG_ROOMS.map((r) => ({
      id: `seed-room-${String(r.unit_number).padStart(2, "0")}`,
      organization_id: orgId,
      property_id: propertyId,
      room_type_id: r.marketing_category
        ? ROOM_TYPE_IDS[r.marketing_category]
        : null,
      code: r.code,
      unit_number: r.unit_number,
      name: r.name,
      max_guests: r.max_guests,
      status: r.status,
      legacy_property_id: null,
      created_at: null,
      updated_at: null,
    })),
    source: "seed",
  };
}
