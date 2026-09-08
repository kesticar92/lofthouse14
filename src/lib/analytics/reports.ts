/**
 * Analytics / revenue / AI stubs (Fase 11).
 */

import type { PmsMetrics } from "@/lib/pms/metrics";

export type RevenueRecommendation = {
  id: string;
  title: string;
  rationale: string;
  suggestedAction: string;
  autoApply: false;
  confidence: "low" | "medium" | "high";
};

export function buildRevenueRecommendations(metrics: PmsMetrics): RevenueRecommendation[] {
  const recs: RevenueRecommendation[] = [];
  if (metrics.occupancyRate < 0.45) {
    recs.push({
      id: "occ-low",
      title: "Ocupación baja",
      rationale: `Ocupación ${(metrics.occupancyRate * 100).toFixed(0)}% en el periodo.`,
      suggestedAction:
        "Considerar promoción mid-week o abrir descuento ≥7 noches (no auto-aplicado).",
      autoApply: false,
      confidence: "medium",
    });
  }
  if (metrics.occupancyRate > 0.85) {
    recs.push({
      id: "occ-high",
      title: "Alta ocupación",
      rationale: `Ocupación ${(metrics.occupancyRate * 100).toFixed(0)}%.`,
      suggestedAction:
        "Evaluar subir tarifa VD / cerrar descuentos (revisión manual).",
      autoApply: false,
      confidence: "medium",
    });
  }
  if (metrics.adr > 0 && metrics.revpar < metrics.adr * 0.5) {
    recs.push({
      id: "revpar-gap",
      title: "Gap ADR vs RevPAR",
      rationale: "RevPAR muy por debajo del ADR implica inventario vacío relevante.",
      suggestedAction: "Revisar gaps en calendario PMS y canales stub.",
      autoApply: false,
      confidence: "low",
    });
  }
  if (recs.length === 0) {
    recs.push({
      id: "stable",
      title: "Sin alertas fuertes",
      rationale: "Métricas dentro de bandas razonables para stub.",
      suggestedAction: "Mantener tarifas; revisar OTAs cuando haya integración real.",
      autoApply: false,
      confidence: "low",
    });
  }
  return recs;
}

export function metricsToCsv(metrics: PmsMetrics): string {
  const headers = [
    "from",
    "to",
    "rooms",
    "room_nights_available",
    "room_nights_sold",
    "occupancy_rate",
    "room_revenue",
    "adr",
    "revpar",
    "arrivals",
    "departures",
    "in_house",
  ];
  const row = [
    metrics.from,
    metrics.to,
    metrics.rooms,
    metrics.roomNightsAvailable,
    metrics.roomNightsSold,
    metrics.occupancyRate.toFixed(4),
    Math.round(metrics.roomRevenue),
    Math.round(metrics.adr),
    Math.round(metrics.revpar),
    metrics.arrivals,
    metrics.departures,
    metrics.inHouse,
  ];
  return `${headers.join(",")}\n${row.join(",")}\n`;
}

export type AiAssistantResponse = {
  ok: boolean;
  requiresLlmKey: boolean;
  message: string;
  stubAnswer?: string;
  disclaimer?: string;
  autoApply?: false;
};

/** @deprecated Prefer runLlmAssistant from llm-assistant.ts */
export function aiAssistantStub(prompt: string): AiAssistantResponse {
  const hasKey = Boolean(
    process.env.OPENAI_API_KEY?.trim() ||
      process.env.ANTHROPIC_API_KEY?.trim() ||
      process.env.LLM_API_KEY?.trim(),
  );
  if (!hasKey) {
    return {
      ok: true,
      requiresLlmKey: true,
      message:
        "AI assistant stub: requires LLM key (OPENAI_API_KEY / ANTHROPIC_API_KEY / LLM_API_KEY). TODO: REAL INTEGRATION REQUIRED.",
      stubAnswer: `Stub (sin key): ${prompt.slice(0, 120)}`,
      disclaimer:
        "Respuesta orientativa. No se auto-aplican cambios de precio. Revisión humana obligatoria.",
      autoApply: false,
    };
  }
  return {
    ok: true,
    requiresLlmKey: false,
    message: "Key detectada — usar POST /api/admin/analytics (runLlmAssistant).",
    stubAnswer: `Use runLlmAssistant for live reply. Prompt: ${prompt.slice(0, 120)}`,
    disclaimer:
      "Respuesta orientativa. No se auto-aplican cambios de precio. Revisión humana obligatoria.",
    autoApply: false,
  };
}
