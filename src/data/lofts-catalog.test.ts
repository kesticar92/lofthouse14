import { describe, expect, it } from "vitest";
import { allBookableUnits, getLoftBySlug, loftUnits } from "./lofts-catalog";

describe("catálogo de lofts", () => {
  it("tiene slugs únicos en minúsculas con guiones", () => {
    const slugs = allBookableUnits.map((unit) => unit.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("describe cada loft con más de 150 palabras", () => {
    for (const unit of loftUnits) {
      const words = unit.description.trim().split(/\s+/).length;
      expect(words, unit.code).toBeGreaterThanOrEqual(150);
    }
  });

  it("resuelve loft-01-cali-miraflores y casa entera", () => {
    expect(getLoftBySlug("loft-01-cali-miraflores")?.code).toBe("01");
    expect(getLoftBySlug("casa-entera-grupos-cali")?.type).toBe("casa");
  });
});
