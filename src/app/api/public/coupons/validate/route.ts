import { z } from "zod";
import { validateCoupon } from "@/lib/promotions/coupons";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().min(0),
  nights: z.number().int().min(0).optional(),
  as_of: z.string().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Payload inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = validateCoupon({
    code: parsed.data.code,
    subtotal: parsed.data.subtotal,
    nights: parsed.data.nights,
    asOf: parsed.data.as_of,
  });
  if (!result.ok) {
    return Response.json(result, { status: 400 });
  }
  return Response.json({
    ok: true,
    discount: result.discount,
    total_after: result.total_after,
    message: result.message,
    coupon: {
      code: result.coupon.code,
      name: result.coupon.name,
      discount_type: result.coupon.discount_type,
      discount_value: result.coupon.discount_value,
    },
  });
}
