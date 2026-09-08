import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createMockWhatsAppSender,
  createMetaWhatsAppClient,
  getWhatsAppProvider,
  listMessagingLogs,
  resetMessagingLogs,
} from "./provider";

describe("messaging providers", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    resetMessagingLogs();
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("mock whatsapp loguea sin enviar", async () => {
    const r = await createMockWhatsAppSender().send({
      to: "+573001112233",
      body: "Hola test",
    });
    expect(r.mode).toBe("mock");
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/TODO: REAL INTEGRATION REQUIRED/);
    expect(listMessagingLogs()).toHaveLength(1);
  });

  it("meta client sin token falla claro", async () => {
    const client = createMetaWhatsAppClient();
    expect(client.isStub).toBe(true);
    const r = await client.send({ to: "300", body: "x" });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/WHATSAPP_TOKEN/);
  });

  it("getWhatsAppProvider usa mock sin token", () => {
    expect(getWhatsAppProvider().isStub).toBe(true);
  });
});
