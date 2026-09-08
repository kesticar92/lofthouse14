import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  buildWompiIntegritySignature,
  createWompiCheckout,
  verifyWompiWebhook,
  verifyWompiWebhookSignature,
  wompiSecretsConfigured,
} from "./wompi";
import {
  getWebhookIdempotency,
  resetWebhookIdempotency,
  setWebhookIdempotency,
} from "./webhook-idempotency";
import { createHmac } from "node:crypto";

describe("wompi provider", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  beforeEach(() => {
    delete process.env.WOMPI_PUBLIC_KEY;
    delete process.env.WOMPI_PRIVATE_KEY;
    delete process.env.WOMPI_EVENTS_SECRET;
    delete process.env.WOMPI_INTEGRITY_SECRET;
    resetWebhookIdempotency();
  });

  it("sin secrets → mock marcado", async () => {
    expect(wompiSecretsConfigured()).toBe(false);
    const intent = await createWompiCheckout({
      amount: 150_000,
      reservationCode: "LH-WOM001",
    });
    expect(intent.status).toBe("stub");
    expect(intent.message).toMatch(/TODO: REAL INTEGRATION REQUIRED/);
    expect(intent.publicMeta?.mode).toBe("mock");
  });

  it("con secrets → checkout pending + URL", async () => {
    process.env.WOMPI_PUBLIC_KEY = "pub_test_x";
    process.env.WOMPI_PRIVATE_KEY = "prv_test_x";
    process.env.WOMPI_INTEGRITY_SECRET = "int_test_x";
    const intent = await createWompiCheckout({
      amount: 200_000,
      reservationCode: "LH-WOM002",
      idempotencyKey: "ref-LH-WOM002",
    });
    expect(intent.status).toBe("pending");
    expect(intent.checkoutUrl).toContain("pub_test_x");
    expect(intent.publicMeta?.mode).toBe("live");
  });

  it("firma integridad es determinista", () => {
    const a = buildWompiIntegritySignature({
      reference: "ref1",
      amountInCents: 10000,
      currency: "COP",
      integritySecret: "secret",
    });
    const b = buildWompiIntegritySignature({
      reference: "ref1",
      amountInCents: 10000,
      currency: "COP",
      integritySecret: "secret",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("verifica webhook HMAC", async () => {
    const secret = "evt_secret";
    const body = { data: { transaction: { status: "APPROVED", id: "tx1" } } };
    const checksum = createHmac("sha256", secret)
      .update(JSON.stringify(body))
      .digest("hex");
    const v = verifyWompiWebhookSignature({
      body,
      headers: { "x-event-checksum": checksum },
      eventsSecret: secret,
    });
    expect(v.ok).toBe(true);

    const result = await verifyWompiWebhook({
      headers: { "x-event-checksum": checksum },
      body,
      env: {
        publicKey: "p",
        privateKey: "s",
        eventsSecret: secret,
        integritySecret: null,
        checkoutBaseUrl: "https://checkout.wompi.co/p/",
      },
    });
    expect(result.status).toBe("paid");
  });

  it("idempotencia de webhook", () => {
    setWebhookIdempotency({
      provider: "wompi",
      key: "evt-1",
      status: "paid",
      result: { ok: true },
    });
    expect(getWebhookIdempotency("wompi", "evt-1")?.status).toBe("paid");
  });
});
