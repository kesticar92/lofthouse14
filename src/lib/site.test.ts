import { describe, expect, it } from "vitest";
import { WHATSAPP_DIGITS, waLink } from "./site";

describe("waLink", () => {
  it("arma wa.me con el número oficial y mensaje codificado", () => {
    const u = waLink("Hola LOFTHOUSE");
    expect(u).toMatch(
      new RegExp(`^https:\\/\\/wa\\.me\\/${WHATSAPP_DIGITS}\\?text=`),
    );
    const q = new URL(u).searchParams.get("text");
    expect(q).toBe("Hola LOFTHOUSE");
  });
});
