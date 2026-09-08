/**
 * Idempotencia de webhooks de pago (memoria proceso).
 */

export type WebhookIdempotencyRecord = {
  key: string;
  provider: string;
  status: string;
  created_at: string;
  result: Record<string, unknown>;
};

const g = globalThis as unknown as {
  __lhPaymentWebhookIdem?: Map<string, WebhookIdempotencyRecord>;
};

function map() {
  if (!g.__lhPaymentWebhookIdem) g.__lhPaymentWebhookIdem = new Map();
  return g.__lhPaymentWebhookIdem;
}

export function webhookIdempotencyKey(
  provider: string,
  key: string,
): string {
  return `${provider}:${key.trim()}`;
}

export function getWebhookIdempotency(
  provider: string,
  key: string,
): WebhookIdempotencyRecord | null {
  if (!key?.trim()) return null;
  return map().get(webhookIdempotencyKey(provider, key)) ?? null;
}

export function setWebhookIdempotency(input: {
  provider: string;
  key: string;
  status: string;
  result: Record<string, unknown>;
}): WebhookIdempotencyRecord {
  const row: WebhookIdempotencyRecord = {
    key: input.key.trim(),
    provider: input.provider,
    status: input.status,
    created_at: new Date().toISOString(),
    result: input.result,
  };
  map().set(webhookIdempotencyKey(input.provider, input.key), row);
  return row;
}

export function resetWebhookIdempotency() {
  g.__lhPaymentWebhookIdem = new Map();
}
