/**
 * Payments abstraction (Fase 10).
 * TODO: REAL INTEGRATION REQUIRED — no secretos en frontend.
 */

export type PaymentProviderId =
  | "wompi"
  | "mercadopago"
  | "stripe"
  | "payu"
  | "manual"
  | "stub";

export type PaymentIntentInput = {
  amount: number;
  currency?: string;
  reservationId?: string;
  reservationCode?: string;
  description?: string;
  idempotencyKey?: string;
  customerEmail?: string;
};

export type PaymentIntentResult = {
  ok: boolean;
  provider: PaymentProviderId;
  status: "stub" | "created" | "pending" | "paid" | "failed";
  externalId?: string;
  checkoutUrl?: string | null;
  message: string;
  /** Nunca incluir secret keys */
  publicMeta?: Record<string, unknown>;
};

export type PaymentProvider = {
  id: PaymentProviderId;
  displayName: string;
  isStub: boolean;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  handleWebhook(input: {
    headers: Record<string, string>;
    body: unknown;
    idempotencyKey?: string;
  }): Promise<PaymentIntentResult>;
};

function stubProvider(
  id: PaymentProviderId,
  displayName: string,
): PaymentProvider {
  return {
    id,
    displayName,
    isStub: true,
    async createIntent(input) {
      return {
        ok: true,
        provider: id,
        status: "stub",
        externalId: `stub_${id}_${Date.now()}`,
        checkoutUrl: null,
        message: `TODO: REAL INTEGRATION REQUIRED — ${displayName}. No se cobró ${input.amount} ${input.currency ?? "COP"}.`,
        publicMeta: {
          reservationCode: input.reservationCode,
          amount: input.amount,
        },
      };
    },
    async handleWebhook({ idempotencyKey }) {
      return {
        ok: true,
        provider: id,
        status: "stub",
        message: `TODO: REAL INTEGRATION REQUIRED — webhook ${displayName}`,
        publicMeta: { idempotencyKey },
      };
    },
  };
}

export const wompiProvider = stubProvider("wompi", "Wompi");
export const mercadoPagoProvider = stubProvider("mercadopago", "Mercado Pago");
export const stripeProvider = stubProvider("stripe", "Stripe");
export const payuProvider = stubProvider("payu", "PayU");

export const manualProvider: PaymentProvider = {
  id: "manual",
  displayName: "Manual / Transferencia",
  isStub: false,
  async createIntent(input) {
    return {
      ok: true,
      provider: "manual",
      status: "pending",
      externalId: `manual_${Date.now()}`,
      checkoutUrl: null,
      message: "Pago manual registrado como pendiente (sin pasarela).",
      publicMeta: { amount: input.amount },
    };
  },
  async handleWebhook() {
    return {
      ok: true,
      provider: "manual",
      status: "paid",
      message: "Confirmación manual",
    };
  },
};

const REGISTRY: Record<PaymentProviderId, PaymentProvider> = {
  wompi: wompiProvider,
  mercadopago: mercadoPagoProvider,
  stripe: stripeProvider,
  payu: payuProvider,
  manual: manualProvider,
  stub: stubProvider("stub", "Stub"),
};

export function getPaymentProvider(id: string): PaymentProvider | null {
  return REGISTRY[id as PaymentProviderId] ?? null;
}

export function listPaymentProviders(): PaymentProvider[] {
  return Object.values(REGISTRY);
}

export function defaultPaymentProviderId(): PaymentProviderId {
  const env = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (env && env in REGISTRY) return env as PaymentProviderId;
  return "stub";
}
