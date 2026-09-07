import { describe, expect, it } from "vitest";

import {
  CATALOG_ROOMS,
  CATALOG_ROOM_TYPES,
  buildSeedCatalog,
  loftNumbersForCategory,
  maxGuestsOverridesForCategory,
} from "./seed";
import {
  catalogPatchSchema,
  isMarketingCategory,
  marketingCategoryFromRoomTypeCode,
} from "./schema";

describe("catalog seed", () => {
  it("tiene 3 room types Vista/Atrio/Cielo", () => {
    expect(CATALOG_ROOM_TYPES).toHaveLength(3);
    expect(CATALOG_ROOM_TYPES.map((t) => t.marketing_category)).toEqual([
      "vista",
      "atrio",
      "cielo",
    ]);
  });

  it("tiene 14 rooms (LOFT 01–14) con bodega en 04", () => {
    expect(CATALOG_ROOMS).toHaveLength(14);
    const bodega = CATALOG_ROOMS.find((r) => r.unit_number === 4);
    expect(bodega?.status).toBe("storage");
    expect(bodega?.marketing_category).toBeNull();
  });

  it("mapea loft numbers por categoría comercial", () => {
    expect(loftNumbersForCategory("vista")).toEqual([1, 14]);
    expect(loftNumbersForCategory("atrio")).toEqual([5, 7, 8]);
    expect(loftNumbersForCategory("cielo")).toEqual([
      2, 3, 6, 9, 10, 11, 12, 13,
    ]);
  });

  it("override max guests loft 5 = 3", () => {
    expect(maxGuestsOverridesForCategory("atrio")).toEqual({ 5: 3 });
  });

  it("buildSeedCatalog incluye property LOFTHOUSE 14", () => {
    const cat = buildSeedCatalog();
    expect(cat.source).toBe("seed");
    expect(cat.properties).toHaveLength(1);
    expect(cat.properties[0]!.name).toBe("LOFTHOUSE 14");
    expect(cat.room_types).toHaveLength(3);
    expect(cat.rooms).toHaveLength(14);
  });
});

describe("catalog schema", () => {
  it("valida marketing category", () => {
    expect(isMarketingCategory("vista")).toBe(true);
    expect(isMarketingCategory("suite")).toBe(false);
  });

  it("mapea code → marketing", () => {
    expect(marketingCategoryFromRoomTypeCode("atrio")).toBe("atrio");
    expect(marketingCategoryFromRoomTypeCode("x")).toBeNull();
  });

  it("acepta PATCH de room_type", () => {
    const parsed = catalogPatchSchema.safeParse({
      room_type: {
        id: "33333333-3333-4333-8333-333333333301",
        tagline: "Nueva tagline",
        max_guests: 5,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("acepta PATCH de room", () => {
    const parsed = catalogPatchSchema.safeParse({
      room: {
        id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        status: "maintenance",
        room_type_id: "33333333-3333-4333-8333-333333333302",
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza PATCH vacío", () => {
    expect(catalogPatchSchema.safeParse({}).success).toBe(false);
  });
});
