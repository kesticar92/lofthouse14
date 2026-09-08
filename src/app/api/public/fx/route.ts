import { getStubFxRates, convertFromCop, formatMoney } from "@/lib/currency/rates";

/** FX stub público — disclaimer obligatorio. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const amount = Number(url.searchParams.get("amount_cop") ?? "0");
  const fx = getStubFxRates();
  return Response.json({
    ...fx,
    sample:
      Number.isFinite(amount) && amount > 0
        ? {
            amount_cop: amount,
            USD: convertFromCop(amount, "USD", fx),
            EUR: convertFromCop(amount, "EUR", fx),
            formatted: {
              COP: formatMoney(amount, "COP", fx),
              USD: formatMoney(amount, "USD", fx),
              EUR: formatMoney(amount, "EUR", fx),
            },
          }
        : null,
  });
}
