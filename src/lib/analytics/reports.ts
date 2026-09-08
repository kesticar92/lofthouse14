/**
 * Analytics / revenue / AI stubs (Fase 11 + recomendaciones ocupación enriquecidas).
 */

import type { PmsMetrics } from "@/lib/pms/metrics";

export type RevenueRecommendation = {
  id: string;
  title: string;
  rationale: string;
  suggestedAction: string;
  autoApply: false;
  confidence: "low" | "medium" | "high";
  /** Banda de ocupación que disparó la heurística */
  occupancyBand?: "critical_low" | "low" | "mid" | "high" | "critical_high";
  impactHint?: string;
};

function occupancyBand(
  rate: number,
): RevenueRecommendation["occupancyBand"] {
  if (rate < 0.3) return "critical_low";
  if (rate < 0.45) return "low";
  if (rate > 0.92) return "critical_high";
  if (rate > 0.85) return "high";
  return "mid";
}

export function buildRevenueRecommendations(metrics: PmsMetrics): RevenueRecommendation[] {
  const recs: RevenueRecommendation[] = [];
  const occPct = (metrics.occupancyRate * 100).toFixed(0);
  const band = occupancyBand(metrics.occupancyRate);

  if (band === "critical_low") {
    recs.push({
      id: "occ-critical-low",
      title: "Ocupación crítica baja",
      rationale: `Ocupación ${occPct}% — inventario muy ocioso en el periodo.`,
      suggestedAction:
        "Evaluar flash deal mid-week, abrir cupón 10–15% o empujar canales stub (revisión manual, no auto-apply).",
      autoApply: false,
      confidence: "high",
      occupancyBand: band,
      impactHint: "Prioridad: llenar huecos L–J antes de fin de semana.",
    });
  } else if (band === "low") {
    recs.push({
      id: "occ-low",
      title: "Ocupación baja",
      rationale: `Ocupación ${occPct}% en el periodo.`,
      suggestedAction:
        "Considerar promoción mid-week o destacar descuento larga estadía 7/14 (no auto-aplicado).",
      autoApply: false,
      confidence: "medium",
      occupancyBand: band,
      impactHint: "Probar CTA en website / WhatsApp sin bajar tarifa base VD.",
    });
  }

  if (band === "critical_high") {
    recs.push({
      id: "occ-critical-high",
      title: "Ocupación casi llena",
      rationale: `Ocupación ${occPct}% — poco inventario libre.`,
      suggestedAction:
        "Subir tarifa VD / pausar descuentos 7+ en fechas pico (revisión manual).",
      autoApply: false,
      confidence: "high",
      occupancyBand: band,
      impactHint: "Proteger ADR; revisar overbooking en canales stub.",
    });
  } else if (band === "high") {
    recs.push({
      id: "occ-high",
      title: "Alta ocupación",
      rationale: `Ocupación ${occPct}%.`,
      suggestedAction:
        "Evaluar subir tarifa VD / cerrar descuentos (revisión manual).",
      autoApply: false,
      confidence: "medium",
      occupancyBand: band,
      impactHint: "Últimas unidades: priorizar estancias más largas.",
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
      occupancyBand: band,
      impactHint: "Cerrar huecos de 1–2 noches entre reservas.",
    });
  }

  if (metrics.arrivals > 0 && metrics.arrivals >= metrics.rooms * 0.4) {
    recs.push({
      id: "arrivals-heavy",
      title: "Día pesado de llegadas",
      rationale: `${metrics.arrivals} llegadas vs ${metrics.rooms} unidades en el periodo.`,
      suggestedAction:
        "Asegurar housekeeping / check-in digital listos; no tocar tarifas automáticamente.",
      autoApply: false,
      confidence: "medium",
      occupancyBand: band,
      impactHint: "Ops first: turnaround y staff.",
    });
  }

  if (
    metrics.occupancyRate >= 0.45 &&
    metrics.occupancyRate <= 0.7 &&
    metrics.adr > 0
  ) {
    recs.push({
      id: "mid-band-lengthen",
      title: "Banda media — alargar estadía",
      rationale: `Ocupación ${occPct}% estable; hay margen para incentivar 7/14 noches.`,
      suggestedAction:
        "Comunicar tramos 7/14/30 en cotizaciones (sin auto-apply de precios).",
      autoApply: false,
      confidence: "low",
      occupancyBand: band,
      impactHint: "Mejora RevPAR sin dump de tarifa corta.",
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
      occupancyBand: band,
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
