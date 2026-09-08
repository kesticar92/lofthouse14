/**
 * Multimoneda foundation — COP base + display USD/EUR.
 * Provider stub estilo ECB-like mock. NO tasas oficiales.
 */

export type DisplayCurrency = "COP" | "USD" | "EUR";

export type FxRateSnapshot = {
  base: "COP";
  asOf: string;
  /** Unidades de moneda extranjera por 1 COP (muy pequeñas) — preferimos COP→FX. */
  rates: Record<"USD" | "EUR", number>;
  /** COP por 1 unidad FX (más útil para display). */
  copPerUnit: Record<"USD" | "EUR", number>;
  provider: "stub_ecb_like";
  isStub: true;
  disclaimer: string;
};

const STUB_COP_PER_USD = 4100;
const STUB_COP_PER_EUR = 4450;

export const FX_STUB_DISCLAIMER =
  "Tasas stub / mock estilo ECB-like — NO son tasas oficiales ni de mercado. Solo para display. TODO: REAL INTEGRATION REQUIRED (ECB / proveedor FX).";

export function getStubFxRates(now = new Date()): FxRateSnapshot {
  return {
    base: "COP",
    asOf: now.toISOString(),
    rates: {
      USD: 1 / STUB_COP_PER_USD,
      EUR: 1 / STUB_COP_PER_EUR,
    },
    copPerUnit: {
      USD: STUB_COP_PER_USD,
      EUR: STUB_COP_PER_EUR,
    },
    provider: "stub_ecb_like",
    isStub: true,
    disclaimer: FX_STUB_DISCLAIMER,
  };
}

export function convertFromCop(
  amountCop: number,
  currency: DisplayCurrency,
  snapshot: FxRateSnapshot = getStubFxRates(),
): { amount: number; currency: DisplayCurrency; stub: true } {
  const n = Math.round(Number(amountCop) || 0);
  if (currency === "COP") {
    return { amount: n, currency: "COP", stub: true };
  }
  const per = snapshot.copPerUnit[currency];
  return {
    amount: Math.round((n / per) * 100) / 100,
    currency,
    stub: true,
  };
}

export function formatMoney(
  amountCop: number,
  currency: DisplayCurrency = "COP",
  snapshot: FxRateSnapshot = getStubFxRates(),
): string {
  if (currency === "COP") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Math.round(amountCop));
  }
  const { amount } = convertFromCop(amountCop, currency, snapshot);
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
