import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  loadLoftsMarketing,
  marketingDefaultsForAdmin,
  saveLoftsMarketing,
  type LoftMarketingOverride,
} from "@/lib/lofts-marketing/store";
import type { LoftCategoryId } from "@/data/loft-categories";

const IDS: LoftCategoryId[] = ["vista", "atrio", "cielo"];

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "catalogo");
  if (mod) return mod;

  const snap = loadLoftsMarketing();
  return Response.json({
    mode: "local",
    store: ".data/lofts-marketing.json",
    updated_at: snap.updated_at,
    overrides: snap.categories,
    defaults: marketingDefaultsForAdmin(),
    note:
      "Overrides locales en `.data/lofts-marketing.json`. Sin tabla Supabase — ver docs/LOFTS-MARKETING.md.",
  });
}

export async function PUT(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "catalogo");
  if (mod) return mod;

  let body: {
    categories?: Partial<Record<LoftCategoryId, LoftMarketingOverride>>;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.categories || typeof body.categories !== "object") {
    return Response.json({ error: "Falta categories" }, { status: 400 });
  }

  const cleaned: Partial<Record<LoftCategoryId, LoftMarketingOverride>> = {};
  for (const id of IDS) {
    const patch = body.categories[id];
    if (!patch) continue;
    const images = Array.isArray(patch.images)
      ? patch.images.map((s) => String(s).trim()).filter(Boolean)
      : undefined;
    const amenities = Array.isArray(patch.amenities)
      ? patch.amenities.map((s) => String(s).trim()).filter(Boolean)
      : undefined;
    cleaned[id] = { images, amenities };
  }

  const snap = saveLoftsMarketing(cleaned);
  return Response.json({
    ok: true,
    updated_at: snap.updated_at,
    overrides: snap.categories,
    defaults: marketingDefaultsForAdmin(),
  });
}
