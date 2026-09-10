import { describe, expect, it } from "vitest";
import {
  applyLoftMarketingOverrides,
  LOFT_CATEGORIES,
} from "@/data/loft-categories";
import { stayDraftFromQuery } from "@/lib/stay-draft";

describe("stayDraftFromQuery", () => {
  it("parsea from=banner y fechas", () => {
    const d = stayDraftFromQuery(
      new URLSearchParams(
        "check_in=2026-10-01&check_out=2026-10-03&guests=2&from=banner&step=3",
      ),
    );
    expect(d.from).toBe("banner");
    expect(d.checkIn).toBe("2026-10-01");
    expect(d.guests).toBe(2);
    expect(d.step).toBe(3);
    expect(d.categoryId).toBeUndefined();
  });

  it("parsea from=card y category", () => {
    const d = stayDraftFromQuery(
      new URLSearchParams("category=cielo&from=card&step=1"),
    );
    expect(d.from).toBe("card");
    expect(d.categoryId).toBe("cielo");
  });
});

describe("loft categories images", () => {
  it("cada categoría tiene 3 fotos de carrusel", () => {
    for (const cat of LOFT_CATEGORIES) {
      expect(cat.images.length).toBeGreaterThanOrEqual(3);
      expect(cat.image).toBe(cat.images[0]);
    }
  });

  it("atrio no usa foto de cortina abierta como portada", () => {
    const atrio = LOFT_CATEGORIES.find((c) => c.id === "atrio")!;
    expect(atrio.images[0]).toContain("42-loft-interior-moderno");
  });

  it("applyLoftMarketingOverrides respeta overrides", () => {
    const next = applyLoftMarketingOverrides(LOFT_CATEGORIES, {
      vista: { amenities: ["WiFi"], images: ["/a.webp", "/b.webp"] },
    });
    const vista = next.find((c) => c.id === "vista")!;
    expect(vista.amenities).toEqual(["WiFi"]);
    expect(vista.images).toEqual(["/a.webp", "/b.webp"]);
    expect(vista.image).toBe("/a.webp");
  });
});
