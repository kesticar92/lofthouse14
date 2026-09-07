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

describe("resolveStaffOrganizationId switcher", () => {
  it("prioriza preferredOrganizationId si es membership activa", async () => {
    const preferred = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const other = "11111111-1111-4111-8111-111111111111";
    const supabase = {
      from: (table: string) => {
        if (table === "org_members") {
          return {
            select: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: [
                      { organization_id: other, role: "staff", status: "active" },
                      {
                        organization_id: preferred,
                        role: "org_admin",
                        status: "active",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [
                  { id: other, slug: "lofthouse" },
                  { id: preferred, slug: "otro" },
                ],
                error: null,
              }),
          }),
        };
      },
    };

    const { resolveStaffOrganizationId } = await import("./organization");
    const id = await resolveStaffOrganizationId(supabase as never, {
      userId: "u1",
      role: "staff",
      preferredOrganizationId: preferred,
    });
    expect(id).toBe(preferred);
  });
});
