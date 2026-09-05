import { describe, expect, it } from "vitest";
import {
  buildDriveFilename,
  sanitizeExpenseFilename,
} from "@/lib/expenses/upload-expense-file";

describe("sanitizeExpenseFilename", () => {
  it("recorta paths absolutos y caracteres no permitidos", () => {
    expect(sanitizeExpenseFilename("/tmp/Factura #1 (mayo).pdf")).toBe(
      "Factura _1 (mayo).pdf",
    );
  });

  it("preserva tildes y dígitos", () => {
    expect(sanitizeExpenseFilename("Recibó-Énergía_2026.pdf")).toBe(
      "Recibó-Énergía_2026.pdf",
    );
  });

  it("usa 'archivo' como fallback si queda vacío", () => {
    expect(sanitizeExpenseFilename("")).toBe("archivo");
    expect(sanitizeExpenseFilename("///")).toBe("archivo");
  });
});

describe("buildDriveFilename", () => {
  it("genera prefijo fecha+shortId conservando el archivo original", () => {
    const out = buildDriveFilename({
      expenseDateISO: "2026-05-11",
      expenseId: "a1b2c3d4-1111-2222-3333-444455556666",
      originalFilename: "factura.pdf",
    });
    expect(out).toBe("2026-05-11_a1b2c3d4_factura.pdf");
  });

  it("usa solo los primeros 10 chars de la fecha aunque venga con tiempo", () => {
    const out = buildDriveFilename({
      expenseDateISO: "2026-05-11T15:42:00.000Z",
      expenseId: "abcdef01-2345-6789-aaaa-bbbbccccdddd",
      originalFilename: "recibo.jpg",
    });
    expect(out.startsWith("2026-05-11_abcdef01_")).toBe(true);
  });

  it("sanea el nombre original y no excede 240 caracteres", () => {
    const longName = "x".repeat(300) + ".pdf";
    const out = buildDriveFilename({
      expenseDateISO: "2026-05-11",
      expenseId: "deadbeef-cafe-0000-0000-000000000000",
      originalFilename: longName,
    });
    expect(out.length).toBeLessThanOrEqual(240);
    expect(out.startsWith("2026-05-11_deadbeef_")).toBe(true);
  });
});
