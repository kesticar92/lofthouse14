/** Promociones / cupones (seed + store local). */

export type CouponDiscountType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: CouponDiscountType;
  /** percent: 0–100; fixed: COP */
  discount_value: number;
  active: boolean;
  /** Mínimo de noches (opcional) */
  min_nights?: number | null;
  /** Tope de descuento COP (solo percent) */
  max_discount_cop?: number | null;
  valid_from?: string | null;
  valid_to?: string | null;
  created_at: string;
  updated_at: string;
};

export type CouponValidationInput = {
  code: string;
  subtotal: number;
  nights?: number;
  asOf?: string;
};

export type CouponValidationResult =
  | {
      ok: true;
      coupon: Coupon;
      discount: number;
      total_after: number;
      message: string;
    }
  | { ok: false; error: string; code: string };

const SEED: Omit<Coupon, "created_at" | "updated_at">[] = [
  {
    id: "cpn-welcome10",
    code: "BIENVENIDA10",
    name: "Bienvenida 10%",
    description: "10% en alojamiento (máx $80.000 COP)",
    discount_type: "percent",
    discount_value: 10,
    active: true,
    min_nights: 1,
    max_discount_cop: 80_000,
    valid_from: null,
    valid_to: null,
  },
  {
    id: "cpn-midweek50k",
    code: "MIDWEEK50",
    name: "Mid-week $50k",
    description: "$50.000 COP fijos · mín. 2 noches",
    discount_type: "fixed",
    discount_value: 50_000,
    active: true,
    min_nights: 2,
    max_discount_cop: null,
    valid_from: null,
    valid_to: null,
  },
  {
    id: "cpn-expired",
    code: "EXPIRADO",
    name: "Cupón expirado (demo)",
    description: "Para tests de validación",
    discount_type: "percent",
    discount_value: 20,
    active: true,
    min_nights: 1,
    max_discount_cop: null,
    valid_from: "2020-01-01",
    valid_to: "2020-12-31",
  },
];

const g = globalThis as unknown as {
  __lhCoupons?: Map<string, Coupon>;
};

function map() {
  if (!g.__lhCoupons) {
    g.__lhCoupons = new Map();
    const now = new Date().toISOString();
    for (const s of SEED) {
      const row: Coupon = { ...s, created_at: now, updated_at: now };
      g.__lhCoupons.set(row.id, row);
      g.__lhCoupons.set(`code:${row.code.toUpperCase()}`, row);
    }
  }
  return g.__lhCoupons;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `cpn-${crypto.randomUUID()}`;
  }
  return `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listCoupons(): Coupon[] {
  const seen = new Set<string>();
  const out: Coupon[] = [];
  for (const [k, v] of map()) {
    if (k.startsWith("code:")) continue;
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out.sort((a, b) => a.code.localeCompare(b.code));
}

export function getCouponByCode(code: string): Coupon | null {
  return map().get(`code:${code.trim().toUpperCase()}`) ?? null;
}

export function upsertCoupon(
  input: Partial<Coupon> & {
    code: string;
    name: string;
    discount_type: CouponDiscountType;
    discount_value: number;
  },
): Coupon {
  const now = new Date().toISOString();
  const code = input.code.trim().toUpperCase();
  const existing = getCouponByCode(code);
  const id = input.id || existing?.id || newId();
  if (existing && existing.id !== id) {
    map().delete(existing.id);
    map().delete(`code:${existing.code}`);
  }
  const row: Coupon = {
    id,
    code,
    name: input.name.trim(),
    description: (input.description ?? existing?.description ?? "").trim(),
    discount_type: input.discount_type,
    discount_value: Number(input.discount_value),
    active: input.active ?? existing?.active ?? true,
    min_nights: input.min_nights ?? existing?.min_nights ?? null,
    max_discount_cop:
      input.max_discount_cop ?? existing?.max_discount_cop ?? null,
    valid_from: input.valid_from ?? existing?.valid_from ?? null,
    valid_to: input.valid_to ?? existing?.valid_to ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  map().set(row.id, row);
  map().set(`code:${row.code}`, row);
  return row;
}

export function deleteCoupon(idOrCode: string): boolean {
  const byId = map().get(idOrCode);
  const byCode = getCouponByCode(idOrCode);
  const row = byId ?? byCode;
  if (!row) return false;
  map().delete(row.id);
  map().delete(`code:${row.code}`);
  return true;
}

export function computeCouponDiscount(
  coupon: Coupon,
  subtotal: number,
): number {
  const base = Math.max(0, Math.round(subtotal));
  if (base <= 0) return 0;
  let discount = 0;
  if (coupon.discount_type === "percent") {
    discount = Math.round((base * coupon.discount_value) / 100);
    if (
      coupon.max_discount_cop != null &&
      Number.isFinite(coupon.max_discount_cop)
    ) {
      discount = Math.min(discount, Math.round(coupon.max_discount_cop));
    }
  } else {
    discount = Math.round(coupon.discount_value);
  }
  return Math.min(base, Math.max(0, discount));
}

export function validateCoupon(
  input: CouponValidationInput,
): CouponValidationResult {
  const code = input.code?.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Código vacío", code: "EMPTY" };
  }
  const coupon = getCouponByCode(code);
  if (!coupon) {
    return { ok: false, error: "Cupón no encontrado", code: "NOT_FOUND" };
  }
  if (!coupon.active) {
    return { ok: false, error: "Cupón inactivo", code: "INACTIVE" };
  }
  const asOf = (input.asOf ?? new Date().toISOString().slice(0, 10)).slice(
    0,
    10,
  );
  if (coupon.valid_from && asOf < coupon.valid_from) {
    return { ok: false, error: "Cupón aún no vigente", code: "NOT_STARTED" };
  }
  if (coupon.valid_to && asOf > coupon.valid_to) {
    return { ok: false, error: "Cupón expirado", code: "EXPIRED" };
  }
  if (
    coupon.min_nights != null &&
    input.nights != null &&
    input.nights < coupon.min_nights
  ) {
    return {
      ok: false,
      error: `Mínimo ${coupon.min_nights} noche(s)`,
      code: "MIN_NIGHTS",
    };
  }
  const subtotal = Math.max(0, Math.round(input.subtotal || 0));
  const discount = computeCouponDiscount(coupon, subtotal);
  return {
    ok: true,
    coupon,
    discount,
    total_after: Math.max(0, subtotal - discount),
    message: `${coupon.name}: −${discount.toLocaleString("es-CO")} COP`,
  };
}

export function resetCoupons() {
  g.__lhCoupons = undefined;
  map();
}
