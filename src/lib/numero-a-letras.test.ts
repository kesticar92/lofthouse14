import { describe, expect, it } from "vitest";
import { numeroALetras } from "./numero-a-letras";

describe("numeroALetras", () => {
  it("cero", () => {
    expect(numeroALetras(0)).toBe("cero pesos");
  });
  it("singular", () => {
    expect(numeroALetras(1)).toBe("un peso");
  });
  it("decenas", () => {
    expect(numeroALetras(21)).toBe("veintiuno pesos");
    expect(numeroALetras(35)).toBe("treinta y cinco pesos");
  });
  it("centenas", () => {
    expect(numeroALetras(100)).toBe("cien pesos");
    expect(numeroALetras(180)).toBe("ciento ochenta pesos");
  });
  it("miles redondos", () => {
    expect(numeroALetras(80_000)).toBe("ochenta mil pesos");
  });
  it("monto típico de cotización", () => {
    expect(numeroALetras(190_000)).toBe("ciento noventa mil pesos");
    expect(numeroALetras(1_234_567)).toBe(
      "un millón doscientos treinta y cuatro mil quinientos sesenta y siete pesos",
    );
  });
});
