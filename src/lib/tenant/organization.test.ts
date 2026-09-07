import { describe, expect, it } from "vitest";

import {
  mapAppRoleToOrgMemberRole,
  enforceOrganizationId,
} from "./organization";

describe("mapAppRoleToOrgMemberRole", () => {
  it("mapea roles de plataforma a roles de org", () => {
    expect(mapAppRoleToOrgMemberRole("super_admin")).toBe("org_admin");
    expect(mapAppRoleToOrgMemberRole("admin")).toBe("property_admin");
    expect(mapAppRoleToOrgMemberRole("staff")).toBe("staff");
  });
});

describe("enforceOrganizationId", () => {
  it("null si hay org", () => {
    expect(enforceOrganizationId("11111111-1111-4111-8111-111111111111")).toBeNull();
  });

  it("403 FORBIDDEN_NO_ORG si falta", async () => {
    const res = enforceOrganizationId(null);
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(403);
    const body = (await res!.json()) as { error: { code?: string } };
    expect(body.error.code).toBe("FORBIDDEN_NO_ORG");
  });
});
