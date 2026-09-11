import { afterEach, describe, expect, it, vi } from "vitest";

describe("SITE_URL production guard", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("rejects localhost in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const { SITE_URL } = await import("./seo");
    expect(SITE_URL).toBe("https://www.lofthouse14.com");
  });

  it("upgrades apex to www", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lofthouse14.com");
    const { SITE_URL } = await import("./seo");
    expect(SITE_URL).toBe("https://www.lofthouse14.com");
  });
});
