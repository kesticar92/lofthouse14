/**
 * SaaS foundations — module_flags / plan seed por organización.
 */

import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export type ModuleFlags = {
  booking: boolean;
  channel_manager: boolean;
  crm: boolean;
  payments: boolean;
  analytics: boolean;
  ai_assistant: boolean;
  einvoicing: boolean;
};

export type OrgPlanId = "starter" | "ops" | "growth";

export type OrgPlanSeed = {
  plan_id: OrgPlanId;
  label: string;
  module_flags: ModuleFlags;
};

export const DEFAULT_MODULE_FLAGS: ModuleFlags = {
  booking: true,
  channel_manager: true,
  crm: true,
  payments: false,
  analytics: true,
  ai_assistant: false,
  einvoicing: false,
};

export const PLAN_SEEDS: Record<OrgPlanId, OrgPlanSeed> = {
  starter: {
    plan_id: "starter",
    label: "Starter",
    module_flags: {
      ...DEFAULT_MODULE_FLAGS,
      channel_manager: false,
      payments: false,
      ai_assistant: false,
      einvoicing: false,
    },
  },
  ops: {
    plan_id: "ops",
    label: "Ops",
    module_flags: {
      ...DEFAULT_MODULE_FLAGS,
      payments: false,
      ai_assistant: false,
      einvoicing: false,
    },
  },
  growth: {
    plan_id: "growth",
    label: "Growth",
    module_flags: {
      ...DEFAULT_MODULE_FLAGS,
      payments: true,
      ai_assistant: true,
      einvoicing: true,
    },
  },
};

export function seedModuleFlagsForOrg(input?: {
  organizationId?: string;
  planId?: OrgPlanId;
}): {
  organization_id: string;
  plan: OrgPlanSeed;
  module_flags: ModuleFlags;
  note: string;
} {
  const planId = input?.planId ?? "ops";
  const plan = PLAN_SEEDS[planId] ?? PLAN_SEEDS.ops;
  return {
    organization_id: input?.organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
    plan,
    module_flags: { ...plan.module_flags },
    note: "Seed local — persistir en organizations.module_flags (migración 028).",
  };
}

export function parseModuleFlags(raw: unknown): ModuleFlags {
  const base = { ...DEFAULT_MODULE_FLAGS };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof ModuleFlags)[]) {
    if (typeof o[key] === "boolean") base[key] = o[key] as boolean;
  }
  return base;
}
