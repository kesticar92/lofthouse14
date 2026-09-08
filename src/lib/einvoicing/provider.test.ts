import { describe, expect, it, beforeEach } from "vitest";
import {
  getDraftInvoiceByCode,
  getEInvoicingProvider,
  resetDraftInvoices,
} from "./provider";

beforeEach(() => {
  resetDraftInvoices();
});

describe("e-invoicing CO", () => {
  it("emite borrador local desde líneas de folio", async () => {
    const provider = getEInvoicingProvider();
    expect(provider.isStub).toBe(true);
    const inv = await provider.issueDraft({
      reservationCode: "LH-INV001",
      guestName: "Ana",
      lines: [
        { label: "Alojamiento", amount: 270000, quantity: 1 },
        { label: "Minibar", amount: 25000, quantity: 1 },
      ],
    });
    expect(inv.status).toBe("draft");
    expect(inv.subtotal).toBe(295000);
    expect(inv.tax_estimate).toBe(Math.round(295000 * 0.19));
    expect(inv.message).toMatch(/TODO: REAL INTEGRATION REQUIRED/);
    expect(getDraftInvoiceByCode("lh-inv001")?.id).toBe(inv.id);
  });
});
