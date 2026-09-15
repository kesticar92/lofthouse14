import { describe, expect, it } from "vitest";
import {
  GRUPO_BASE_MAX_GUESTS,
  GRUPO_MAX_LOFTS,
  GRUPO_MIN_LOFTS,
  clampGrupoGuests,
  clampGrupoLofts,
  grupoMaxGuestsForLofts,
  grupoMinLoftsForGuests,
  mealDefaultDays,
} from "@/lib/configurator-extras";

describe("perfil grupo / delegación", () => {
  it("tope de huéspedes: 20 con 4 lofts y +5 por loft extra", () => {
    expect(grupoMaxGuestsForLofts(4)).toBe(20);
    expect(grupoMaxGuestsForLofts(5)).toBe(25);
    expect(grupoMaxGuestsForLofts(13)).toBe(
      GRUPO_BASE_MAX_GUESTS + (GRUPO_MAX_LOFTS - GRUPO_MIN_LOFTS) * 5,
    );
  });

  it("lofts mínimos según huéspedes", () => {
    expect(grupoMinLoftsForGuests(4)).toBe(4);
    expect(grupoMinLoftsForGuests(20)).toBe(4);
    expect(grupoMinLoftsForGuests(21)).toBe(5);
    expect(grupoMinLoftsForGuests(25)).toBe(5);
    expect(grupoMinLoftsForGuests(26)).toBe(6);
  });

  it("clamp respeta rangos", () => {
    expect(clampGrupoLofts(2)).toBe(4);
    expect(clampGrupoLofts(20)).toBe(13);
    expect(clampGrupoGuests(3, 4)).toBe(4);
    expect(clampGrupoGuests(30, 4)).toBe(20);
    expect(clampGrupoGuests(30, 5)).toBe(25);
  });
});

describe("mealDefaultDays", () => {
  it("precarga días = noches", () => {
    expect(mealDefaultDays(0)).toBe(0);
    expect(mealDefaultDays(1)).toBe(1);
    expect(mealDefaultDays(3)).toBe(3);
  });
});
