import { describe, expect, it } from "vitest";
import { formatLiveAvailabilityMessage } from "@/lib/availability/live-check";

describe("formatLiveAvailabilityMessage", () => {
  it("explica capacidad sin reglas técnicas internas", () => {
    const msg = formatLiveAvailabilityMessage({
      reason: "no_units_for_guests",
      requestedCategoryId: "vista",
      guests: 15,
      alternative: { categoryId: "cielo", name: "Loft Cielo" },
    });
    expect(msg).toContain("Loft Vista no está disponible para 15 huéspedes");
    expect(msg).toContain("En Vista caben máximo 10 personas");
    expect(msg).toContain("hasta 5 por loft");
    expect(msg).toContain("Alternativa disponible: Loft Cielo (hasta 40 personas)");
    expect(msg).not.toContain("loft 5");
    expect(msg).not.toContain("7+8");
  });

  it("mensaje de cupo por fechas con alternativa", () => {
    const msg = formatLiveAvailabilityMessage({
      reason: "category_full",
      requestedCategoryId: "atrio",
      guests: 4,
      alternative: { categoryId: "vista", name: "Loft Vista" },
    });
    expect(msg).toContain("no tiene cupo para esas fechas");
    expect(msg).toContain("En Atrio caben máximo 13 personas");
    expect(msg).toContain("Loft Vista (hasta 10 personas)");
  });
});
