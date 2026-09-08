import { describe, expect, it, beforeEach } from "vitest";
import {
  appendGuestMessage,
  getThread,
  resetGuestMessages,
} from "./messages-store";

beforeEach(() => {
  resetGuestMessages();
});

describe("guest messages", () => {
  it("crea thread y append guest", () => {
    const t = appendGuestMessage("LH-MSG1", "Hola staff", "Ana");
    expect(t.messages.some((m) => m.role === "system")).toBe(true);
    expect(t.messages.some((m) => m.role === "guest")).toBe(true);
    expect(getThread("lh-msg1")?.guest_name).toBe("Ana");
  });
});
