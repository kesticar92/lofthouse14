import { describe, expect, it } from "vitest";

import { parseActiveOrgCookie } from "./active-org-cookie";

describe("parseActiveOrgCookie", () => {
  it("acepta UUID válido", () => {
    expect(
      parseActiveOrgCookie("11111111-1111-4111-8111-111111111111"),
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("rechaza basura", () => {
    expect(parseActiveOrgCookie("lofthouse")).toBeNull();
    expect(parseActiveOrgCookie("")).toBeNull();
    expect(parseActiveOrgCookie(null)).toBeNull();
  });
});
