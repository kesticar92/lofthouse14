import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODULE_FLAGS,
  parseModuleFlags,
  seedModuleFlagsForOrg,
} from "./module-flags";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

describe("saas module flags", () => {
  it("seed ops por defecto con payments off", () => {
    const seed = seedModuleFlagsForOrg({
      organizationId: LOFTHOUSE_ORGANIZATION_ID,
    });
    expect(seed.module_flags.booking).toBe(true);
    expect(seed.module_flags.payments).toBe(false);
    expect(seed.module_flags.ai_assistant).toBe(false);
  });

  it("parseModuleFlags mezcla defaults", () => {
    const flags = parseModuleFlags({ payments: true, unknown: 1 });
    expect(flags.payments).toBe(true);
    expect(flags.booking).toBe(DEFAULT_MODULE_FLAGS.booking);
  });
});
