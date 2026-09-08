import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  deleteCoupon,
  listCoupons,
  upsertCoupon,
  type CouponDiscountType,
} from "@/lib/promotions/coupons";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "cotizaciones");
  if (mod) return mod;

  return Response.json({
    mode: "local",
    coupons: listCoupons(),
    note: "CRUD local/seed — sin motor de marketing externo",
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "cotizaciones");
  if (mod) return mod;

  let body: {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    discount_type?: CouponDiscountType;
    discount_value?: number;
    active?: boolean;
    min_nights?: number | null;
    max_discount_cop?: number | null;
    valid_from?: string | null;
    valid_to?: string | null;
    delete?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.delete && (body.id || body.code)) {
    const ok = deleteCoupon(body.id || body.code!);
    return Response.json({ ok, coupons: listCoupons() });
  }

  if (!body.code?.trim() || !body.name?.trim()) {
    return Response.json(
      { error: "code y name requeridos" },
      { status: 400 },
    );
  }
  const discount_type = body.discount_type ?? "percent";
  const discount_value = Number(body.discount_value ?? 0);
  if (
    !["percent", "fixed"].includes(discount_type) ||
    !Number.isFinite(discount_value) ||
    discount_value < 0
  ) {
    return Response.json({ error: "descuento inválido" }, { status: 400 });
  }

  const coupon = upsertCoupon({
    id: body.id,
    code: body.code,
    name: body.name,
    description: body.description ?? "",
    discount_type,
    discount_value,
    active: body.active ?? true,
    min_nights: body.min_nights ?? null,
    max_discount_cop: body.max_discount_cop ?? null,
    valid_from: body.valid_from ?? null,
    valid_to: body.valid_to ?? null,
  });

  return Response.json({ ok: true, coupon, coupons: listCoupons() });
}
