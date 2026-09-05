import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import {
  SEO_DESCRIPTION_HOME,
  SEO_TITLE_HOME,
  lodgingBusinessJsonLd,
} from "@/lib/seo";
import { getFaqItems } from "@/data/faq";
import { llmsTxt } from "@/lib/llms-content";

describe("SEO auditoría", () => {
  it("title y description incluyen keyword y CTA", () => {
    expect(SEO_TITLE_HOME.toLowerCase()).toContain("lofts en cali");
    expect(SEO_DESCRIPTION_HOME.toLowerCase()).toContain("miraflores");
    expect(SEO_DESCRIPTION_HOME.toLowerCase()).toContain("reserva");
    expect(SEO_DESCRIPTION_HOME.length).toBeGreaterThan(120);
    expect(SEO_DESCRIPTION_HOME.length).toBeLessThan(180);
  });

  it("LodgingBusiness incluye aggregateRating y dirección", () => {
    const schema = lodgingBusinessJsonLd();
    expect(schema["@type"]).toBe("LodgingBusiness");
    expect(schema.aggregateRating.reviewCount).toMatch(/^\d+$/);
    expect(Number(schema.aggregateRating.reviewCount)).toBeGreaterThan(50);
    expect(schema.address.streetAddress).toContain("Carrera 26");
    expect(schema.numberOfRooms).toBe(14);
  });

  it("sitemap lista lofts, reseñas, ubicación y blog sin hashes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(
      urls.some((url) => url.includes("/lofts/loft-01-cali-miraflores")),
    ).toBe(true);
    expect(urls.some((url) => url.includes("/resenas"))).toBe(true);
    expect(urls.some((url) => url.includes("/ubicacion-miraflores-cali"))).toBe(
      true,
    );
    expect(urls.some((url) => url.includes("#"))).toBe(false);
  });

  it("robots permite crawlers y apunta al sitemap", () => {
    const file = robots();
    expect(file.sitemap).toMatch(/sitemap\.xml$/);
    const rules = Array.isArray(file.rules) ? file.rules : [file.rules];
    expect(rules.length).toBeGreaterThan(1);
  });

  it("FAQ y llms.txt documentan el negocio", () => {
    expect(getFaqItems().length).toBeGreaterThan(8);
    expect(llmsTxt()).toContain("Parque del Perro");
    expect(llmsTxt()).toContain("14 lofts");
  });
});
