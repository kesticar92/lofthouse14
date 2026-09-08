import { describe, expect, it } from "vitest";
import { runLlmAssistant } from "./llm-assistant";

describe("llm assistant", () => {
  it("sin key responde stub con disclaimer y autoApply false", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const r = await runLlmAssistant({ prompt: "¿Subo tarifas?" });
    expect(r.autoApply).toBe(false);
    expect(r.mode).toBe("stub");
    expect(r.disclaimer).toMatch(/No se auto-aplican/);
    expect(r.answer).toMatch(/stub|TODO/i);
    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});
