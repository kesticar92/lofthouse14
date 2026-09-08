/**
 * LLM assistant — llama OpenAI si hay key; else stub con disclaimer.
 * Nunca auto-aplica precios.
 */

export type LlmAssistantResult = {
  ok: boolean;
  mode: "live" | "stub";
  disclaimer: string;
  answer: string;
  autoApply: false;
  requiresLlmKey: boolean;
  model?: string;
  message?: string;
};

const DISCLAIMER =
  "Respuesta orientativa. No se auto-aplican cambios de precio ni inventario. Revisión humana obligatoria.";

function hasLlmKey(): { key: string; provider: "openai" | "generic" } | null {
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) return { key: openai, provider: "openai" };
  const generic =
    process.env.LLM_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim();
  if (generic) return { key: generic, provider: "generic" };
  return null;
}

export async function runLlmAssistant(input: {
  prompt: string;
  context?: string;
}): Promise<LlmAssistantResult> {
  const prompt = (input.prompt ?? "").trim().slice(0, 4000);
  const context = (input.context ?? "").trim().slice(0, 4000);
  const creds = hasLlmKey();

  if (!creds) {
    return {
      ok: true,
      mode: "stub",
      disclaimer: DISCLAIMER,
      answer: [
        "AI assistant stub (sin OPENAI_API_KEY / LLM_API_KEY).",
        "Sugerencia genérica: revisar ocupación mid-week, gaps en calendario y tarifas VD vs ADR.",
        `Prompt recibido: ${prompt.slice(0, 160) || "(vacío)"}`,
        "TODO: REAL INTEGRATION REQUIRED.",
      ].join(" "),
      autoApply: false,
      requiresLlmKey: true,
      message:
        "Stub — configura OPENAI_API_KEY para respuestas live (sin auto-apply).",
    };
  }

  if (creds.provider === "openai") {
    try {
      const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "Eres un asistente de revenue hospitality. Nunca indiques que aplicaste cambios. Solo recomendaciones. Responde en español, breve.",
            },
            {
              role: "user",
              content: context
                ? `Contexto:\n${context}\n\nPregunta:\n${prompt}`
                : prompt,
            },
          ],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        choices?: Array<{ message?: { content?: string } }>;
        error?: { message?: string };
      };
      if (!res.ok) {
        return {
          ok: false,
          mode: "live",
          disclaimer: DISCLAIMER,
          answer: data.error?.message ?? `OpenAI HTTP ${res.status}`,
          autoApply: false,
          requiresLlmKey: false,
          model,
          message: "Error llamando OpenAI",
        };
      }
      return {
        ok: true,
        mode: "live",
        disclaimer: DISCLAIMER,
        answer:
          data.choices?.[0]?.message?.content?.trim() ||
          "(respuesta vacía)",
        autoApply: false,
        requiresLlmKey: false,
        model,
      };
    } catch (err) {
      return {
        ok: false,
        mode: "live",
        disclaimer: DISCLAIMER,
        answer: err instanceof Error ? err.message : "Error de red OpenAI",
        autoApply: false,
        requiresLlmKey: false,
      };
    }
  }

  // Anthropic / generic key presente pero sin adapter completo
  return {
    ok: true,
    mode: "stub",
    disclaimer: DISCLAIMER,
    answer: `Key LLM detectada (no-OpenAI) pero adapter no cableado. Stub para: ${prompt.slice(0, 120)}. TODO: REAL INTEGRATION REQUIRED.`,
    autoApply: false,
    requiresLlmKey: false,
    message: "Usa OPENAI_API_KEY para el adapter live actual.",
  };
}
