/**
 * Wompi PaymentProvider — HMAC webhook + checkout.
 * Sin secrets → modo mock marcado (TODO: REAL INTEGRATION REQUIRED).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
} from "./provider";

export type WompiEnv = {
  publicKey: string | null;
  privateKey: string | null;
  eventsSecret: string | null;
  integritySecret: string | null;
  checkoutBaseUrl: string;
};

export function readWompiEnv(): WompiEnv {
  return {
    publicKey: process.env.WOMPI_PUBLIC_KEY?.trim() || null,
    privateKey: process.env.WOMPI_PRIVATE_KEY?.trim() || null,
    eventsSecret:
      process.env.WOMPI_EVENTS_SECRET?.trim() ||
      process.env.WOMPI_INTEGRITY_SECRET?.trim() ||
      null,
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET?.trim() || null,
    checkoutBaseUrl:
      process.env.WOMPI_CHECKOUT_BASE_URL?.trim() ||
      "https://checkout.wompi.co/p/",
  };
}

export function wompiSecretsConfigured(env = readWompiEnv()): boolean {
  return Boolean(env.publicKey && env.privateKey);
}

/** Firma de integridad checkout: SHA256(reference + amountInCents + currency + integritySecret) */
export function buildWompiIntegritySignature(input: {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
}): string {
  const raw = `${input.reference}${input.amountInCents}${input.currency}${input.integritySecret}`;
  return createHmac("sha256", input.integritySecret).update(raw).digest("hex");
}

/**
 * Verifica firma HMAC de eventos Wompi.
 * Acepta header `x-event-checksum` o body.signature / checksum.
 */
export function verifyWompiWebhookSignature(input: {
  body: unknown;
  headers: Record<string, string>;
  eventsSecret: string;
}): { ok: boolean; reason?: string } {
  const headers = Object.fromEntries(
    Object.entries(input.headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const provided =
    headers["x-event-checksum"] ||
    headers["x-wompi-signature"] ||
    (typeof (input.body as { signature?: string })?.signature === "string"
      ? (input.body as { signature: string }).signature
      : null) ||
    (typeof (input.body as { checksum?: string })?.checksum === "string"
      ? (input.body as { checksum: string }).checksum
      : null);

  if (!provided) {
    return { ok: false, reason: "Falta firma (x-event-checksum)" };
  }

  const payload =
    typeof input.body === "string"
      ? input.body
      : JSON.stringify(input.body ?? {});
  const expected = createHmac("sha256", input.eventsSecret)
    .update(payload)
    .digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(provided).trim(), "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "Firma HMAC inválida" };
    }
  } catch {
    return { ok: false, reason: "Firma HMAC inválida" };
  }
  return { ok: true };
}

function extractWebhookStatus(body: unknown): PaymentIntentResult["status"] {
  const b = body as {
    data?: { transaction?: { status?: string } };
    event?: string;
    status?: string;
  };
  const st = (
    b?.data?.transaction?.status ||
    b?.status ||
    ""
  ).toUpperCase();
  if (st === "APPROVED" || st === "PAID" || st === "COMPLETED") return "paid";
  if (st === "DECLINED" || st === "ERROR" || st === "VOIDED") return "failed";
  if (st === "PENDING" || st === "PENDING_PAYMENT") return "pending";
  if (b?.event?.toLowerCase().includes("approved")) return "paid";
  return "pending";
}

export async function createWompiCheckout(
  input: PaymentIntentInput,
  env = readWompiEnv(),
): Promise<PaymentIntentResult> {
  const amountInCents = Math.max(0, Math.round(input.amount));
  const currency = (input.currency ?? "COP").toUpperCase();
  const reference =
    input.idempotencyKey ||
    `LH-${input.reservationCode ?? "PAY"}-${Date.now()}`;

  if (!wompiSecretsConfigured(env)) {
    return {
      ok: true,
      provider: "wompi",
      status: "stub",
      externalId: `mock_wompi_${reference}`,
      checkoutUrl: null,
      message:
        "TODO: REAL INTEGRATION REQUIRED — WOMPI_PUBLIC_KEY / WOMPI_PRIVATE_KEY ausentes. Checkout mock (sin cobro).",
      publicMeta: {
        mode: "mock",
        reference,
        amountInCents,
        currency,
        reservationCode: input.reservationCode,
      },
    };
  }

  const integrity =
    env.integritySecret != null
      ? buildWompiIntegritySignature({
          reference,
          amountInCents,
          currency,
          integritySecret: env.integritySecret,
        })
      : null;

  // Checkout hosted: URL pública con public key (sin llamar API privada aquí).
  const params = new URLSearchParams({
    "public-key": env.publicKey!,
    currency,
    "amount-in-cents": String(amountInCents),
    reference,
  });
  if (integrity) params.set("signature:integrity", integrity);
  if (input.customerEmail) params.set("customer-data:email", input.customerEmail);
  if (input.description) params.set("redirect-url", String(process.env.NEXT_PUBLIC_SITE_URL ?? ""));

  const checkoutUrl = `${env.checkoutBaseUrl}?${params.toString()}`;

  return {
    ok: true,
    provider: "wompi",
    status: "pending",
    externalId: reference,
    checkoutUrl,
    message: "Checkout Wompi creado (pending). Confirmar vía webhook.",
    publicMeta: {
      mode: "live",
      reference,
      amountInCents,
      currency,
      hasIntegrity: Boolean(integrity),
    },
  };
}

export async function verifyWompiWebhook(input: {
  headers: Record<string, string>;
  body: unknown;
  idempotencyKey?: string;
  env?: WompiEnv;
}): Promise<PaymentIntentResult> {
  const env = input.env ?? readWompiEnv();

  if (!env.eventsSecret && !wompiSecretsConfigured(env)) {
    return {
      ok: true,
      provider: "wompi",
      status: "stub",
      message:
        "TODO: REAL INTEGRATION REQUIRED — webhook Wompi en modo mock (sin WOMPI_EVENTS_SECRET).",
      publicMeta: {
        mode: "mock",
        idempotencyKey: input.idempotencyKey,
        extractedStatus: extractWebhookStatus(input.body),
      },
    };
  }

  if (env.eventsSecret) {
    const v = verifyWompiWebhookSignature({
      body: input.body,
      headers: input.headers,
      eventsSecret: env.eventsSecret,
    });
    if (!v.ok) {
      return {
        ok: false,
        provider: "wompi",
        status: "failed",
        message: v.reason ?? "Firma inválida",
        publicMeta: { mode: "live", idempotencyKey: input.idempotencyKey },
      };
    }
  }

  const status = extractWebhookStatus(input.body);
  const b = input.body as {
    data?: { transaction?: { id?: string; reference?: string } };
    reference?: string;
  };
  const externalId =
    b?.data?.transaction?.id ||
    b?.data?.transaction?.reference ||
    b?.reference ||
    input.idempotencyKey;

  return {
    ok: true,
    provider: "wompi",
    status,
    externalId: externalId ? String(externalId) : undefined,
    message:
      status === "paid"
        ? "Webhook Wompi: pago aprobado"
        : `Webhook Wompi: estado ${status}`,
    publicMeta: {
      mode: "live",
      idempotencyKey: input.idempotencyKey,
    },
  };
}

export function createWompiPaymentProvider(): PaymentProvider {
  const configured = wompiSecretsConfigured();
  return {
    id: "wompi",
    displayName: configured ? "Wompi" : "Wompi (mock)",
    isStub: !configured,
    createIntent: (input) => createWompiCheckout(input),
    handleWebhook: (input) => verifyWompiWebhook(input),
  };
}
