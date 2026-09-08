import { lookupLocalBooking } from "@/lib/booking/create-reservation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getLocalPaymentByCode, balanceForPayment } from "@/lib/payments/local-store";
import { getDigitalCheckIn } from "@/lib/guest/check-in-store";
import { getDraftInvoiceByCode } from "@/lib/einvoicing/provider";
import { getStubFxRates, formatMoney } from "@/lib/currency/rates";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = raw?.trim().toUpperCase();
  if (!code) {
    return Response.json({ error: "code requerido" }, { status: 400 });
  }

  const paymentRaw = getLocalPaymentByCode(code);
  const payment = paymentRaw
    ? { ...paymentRaw, balance: balanceForPayment(paymentRaw) }
    : null;
  const checkIn = getDigitalCheckIn(code);
  const invoiceDraft = getDraftInvoiceByCode(code);
  const fx = getStubFxRates();

  function withDisplay(price: number | null | undefined) {
    if (price == null) return null;
    return {
      cop: formatMoney(price, "COP", fx),
      usd: formatMoney(price, "USD", fx),
      eur: formatMoney(price, "EUR", fx),
      disclaimer: fx.disclaimer,
    };
  }

  try {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("reservations")
      .select(
        "id, reservation_code, guest_name, guest_email, guest_phone, check_in, check_out, guests, price, status, payment_status, extras, source, channel, created_at",
      )
      .eq("reservation_code", code)
      .maybeSingle();
    if (data) {
      return Response.json({
        mode: "supabase",
        reservation: data,
        payment,
        check_in: checkIn,
        invoice_draft: invoiceDraft,
        display_price: withDisplay(
          typeof data.price === "number" ? data.price : null,
        ),
        fx: { provider: fx.provider, isStub: fx.isStub, disclaimer: fx.disclaimer },
      });
    }
  } catch {
    /* local */
  }

  const local = lookupLocalBooking(code);
  if (!local) {
    return Response.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  return Response.json({
    mode: "local",
    note: "Mock local — no persiste entre reinicios",
    reservation: local,
    payment,
    check_in: checkIn,
    invoice_draft: invoiceDraft,
    display_price: withDisplay(local.price),
    fx: { provider: fx.provider, isStub: fx.isStub, disclaimer: fx.disclaimer },
  });
}
