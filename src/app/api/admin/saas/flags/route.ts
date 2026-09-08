import { requireStaff } from "@/lib/api/require-staff";
import {
  DEFAULT_MODULE_FLAGS,
  PLAN_SEEDS,
  parseModuleFlags,
  seedModuleFlagsForOrg,
} from "@/lib/saas/module-flags";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

/** Read-only: module_flags / plan seed de la org activa. */
export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;
  let flags = { ...DEFAULT_MODULE_FLAGS };
  let source: "database" | "seed" = "seed";
  let orgName = "LOFTHOUSE";

  if (gate.ctx.organizationId) {
    const { data, error } = await gate.ctx.supabase
      .from("organizations")
      .select("id, name, module_flags, branding")
      .eq("id", orgId)
      .maybeSingle();
    if (!error && data) {
      flags = parseModuleFlags(
        (data as { module_flags?: unknown }).module_flags,
      );
      orgName = (data as { name?: string }).name ?? orgName;
      source = "database";
    }
  }

  const seed = seedModuleFlagsForOrg({
    organizationId: orgId,
    planId: "ops",
  });

  return Response.json({
    organization_id: orgId,
    organization_name: orgName,
    module_flags: flags,
    plans: Object.values(PLAN_SEEDS),
    seed_default: seed,
    source,
    read_only: true,
    note: "Flags read-only en admin. Activar payments/ai/einvoicing requiere secrets + plan. Ver docs/INTEGRATIONS.md y docs/ONBOARDING-SAAS.md.",
  });
}
