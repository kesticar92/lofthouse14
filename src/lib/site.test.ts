import { beforeEach, describe, expect, it, vi } from "vitest";

describe("waLink", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "5731999999999";
  });

  it("arma wa.me con número y mensaje codificado", async () => {
    const { waLink } = await import("./site");
    const u = waLink("Hola LOFTHOUSE");
    expect(u).toMatch(/^https:\/\/wa\.me\/5731999999999\?text=/);
    const q = new URL(u).searchParams.get("text");
    expect(q).toBe("Hola LOFTHOUSE");
  });
});
