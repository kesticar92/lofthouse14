import { describe, expect, it, beforeEach } from "vitest";
import {
  recordLocalAudit,
  listLocalAudit,
  resetLocalAudit,
  sanitizeAuditMetadata,
} from "./local-audit";

beforeEach(() => {
  resetLocalAudit();
});

describe("local audit", () => {
  it("redacta secretos y registra", () => {
    expect(
      sanitizeAuditMetadata({ password: "x", note: "ok" })?.password,
    ).toBe("[redacted]");
    recordLocalAudit({
      action: "payment.deposit_mock",
      entity_type: "payment",
      entity_id: "LH-1",
      metadata: { token: "abc", amount: 1 },
    });
    const rows = listLocalAudit(5);
    expect(rows[0]?.action).toBe("payment.deposit_mock");
    expect(rows[0]?.metadata?.token).toBe("[redacted]");
  });
});
