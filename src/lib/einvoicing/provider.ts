/**
 * Facturación electrónica Colombia — adapter + stub DIAN / proveedor autorizado.
 * Emite borrador local desde folio. TODO: REAL INTEGRATION REQUIRED.
 */

export type EInvoiceStatus = "draft" | "stub_queued" | "rejected";

export type DraftInvoice = {
  id: string;
  reservation_code: string;
  guest_name: string;
  currency: "COP";
  subtotal: number;
  tax_estimate: number;
  total: number;
  lines: Array<{ label: string; amount: number; quantity: number }>;
  status: EInvoiceStatus;
  provider: string;
  cufe_stub: string | null;
  message: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

export type EInvoicingProvider = {
  id: string;
  displayName: string;
  isStub: boolean;
  issueDraft(input: {
    reservationCode: string;
    guestName: string;
    lines: Array<{ label: string; amount: number; quantity: number }>;
    taxRate?: number;
  }): Promise<DraftInvoice>;
};

const g = globalThis as unknown as {
  __lhDraftInvoices?: Map<string, DraftInvoice>;
};

function store() {
  if (!g.__lhDraftInvoices) g.__lhDraftInvoices = new Map();
  return g.__lhDraftInvoices;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDianStubProvider(): EInvoicingProvider {
  const apiKey =
    process.env.EINVOICE_API_KEY?.trim() ||
    process.env.DIAN_API_KEY?.trim() ||
    null;
  const providerName =
    process.env.EINVOICE_PROVIDER?.trim() || "dian_authorized_stub";

  return {
    id: providerName,
    displayName: apiKey
      ? `E-factura (${providerName})`
      : "E-factura CO (stub DIAN)",
    isStub: !apiKey,
    async issueDraft(input) {
      const subtotal = input.lines.reduce(
        (s, l) => s + Math.round(l.amount) * Math.max(1, l.quantity),
        0,
      );
      const taxRate = input.taxRate ?? 0.19;
      const tax_estimate = Math.round(subtotal * taxRate);
      const total = subtotal + tax_estimate;
      const now = new Date().toISOString();
      const id = newId();

      const invoice: DraftInvoice = {
        id,
        reservation_code: input.reservationCode.trim().toUpperCase(),
        guest_name: input.guestName || "Huésped",
        currency: "COP",
        subtotal,
        tax_estimate,
        total,
        lines: input.lines,
        status: "draft",
        provider: providerName,
        cufe_stub: null,
        message: apiKey
          ? "Borrador local listo — envío DIAN/proveedor no cableado aún. TODO: REAL INTEGRATION REQUIRED."
          : "Borrador local (sin EINVOICE_API_KEY). TODO: REAL INTEGRATION REQUIRED — DIAN / proveedor autorizado.",
        created_at: now,
        metadata: { hasApiKey: Boolean(apiKey), taxRate },
      };

      store().set(id, invoice);
      store().set(`code:${invoice.reservation_code}`, invoice);
      return invoice;
    },
  };
}

let cached: EInvoicingProvider | null = null;

export function getEInvoicingProvider(): EInvoicingProvider {
  if (!cached) cached = createDianStubProvider();
  return cached;
}

export function getDraftInvoiceByCode(code: string): DraftInvoice | null {
  return store().get(`code:${code.trim().toUpperCase()}`) ?? null;
}

export function listDraftInvoices(): DraftInvoice[] {
  const seen = new Set<string>();
  const out: DraftInvoice[] = [];
  for (const [k, v] of store()) {
    if (k.startsWith("code:")) continue;
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function resetDraftInvoices() {
  g.__lhDraftInvoices = new Map();
  cached = null;
}
