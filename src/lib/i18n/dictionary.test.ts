import { describe, expect, it } from "vitest";
import { localeFromPathname, resolveLocale, t } from "./dictionary";

describe("i18n dictionary", () => {
  it("resuelve ES/EN", () => {
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("es-CO")).toBe("es");
    expect(localeFromPathname("/en")).toBe("en");
    expect(localeFromPathname("/mi-reserva")).toBe("es");
  });

  it("traduce CTAs clave", () => {
    expect(t("nav.book", "es")).toBe("Reservar");
    expect(t("nav.book", "en")).toBe("Book");
    expect(t("cta.payMock", "en")).toMatch(/mock/i);
  });
});
