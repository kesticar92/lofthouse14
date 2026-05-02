import { requireStaff } from "@/lib/api/require-staff";
import {
  DEFAULT_CLEANING_PRICING,
  parseCleaningPricing,
} from "@/lib/pms/cleaning-pricing";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "cleaning_pricing")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const pricing = parseCleaningPricing(data?.value);
  return Response.json({ pricing });
}

export async function PATCH(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", gate.ctx.user.id)
    .maybeSingle();
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    return Response.json({ error: "Prohibido" }, { status: 403 });
  }

  let body: {
    base_cop?: number;
    guest_threshold?: number;
    extra_per_guest_cop?: number;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const merged = {
    ...DEFAULT_CLEANING_PRICING,
    ...parseCleaningPricing(
      (
        await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "cleaning_pricing")
          .maybeSingle()
      ).data?.value,
    ),
    ...(body.base_cop !== undefined ? { base_cop: body.base_cop } : {}),
    ...(body.guest_threshold !== undefined
      ? { guest_threshold: body.guest_threshold }
      : {}),
    ...(body.extra_per_guest_cop !== undefined
      ? { extra_per_guest_cop: body.extra_per_guest_cop }
      : {}),
  };

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "cleaning_pricing",
      value: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ pricing: merged });
}
