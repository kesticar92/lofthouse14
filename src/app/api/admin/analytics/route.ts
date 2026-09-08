import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { computePmsMetrics } from "@/lib/pms/metrics";
import {
  buildRevenueRecommendations,
  metricsToCsv,
} from "@/lib/analytics/reports";
import { runLlmAssistant } from "@/lib/analytics/llm-assistant";
import { listLocalReservations } from "@/lib/availability/local-store";
import { CATALOG_ROOMS } from "@/lib/catalog/seed";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "analytics");
  if (mod) return mod;

  const { searchParams } = new URL(req.url);
  const from =
    searchParams.get("from") ??
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to =
    searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const format = searchParams.get("format");
  const prompt = searchParams.get("ai_prompt");

  const rooms = CATALOG_ROOMS.filter((r) => r.status === "active").length;
  let reservations = listLocalReservations().map((r) => ({
    property_id: r.property_id,
    check_in: r.check_in,
    check_out: r.check_out,
    status: r.status,
    price: r.price,
  }));

  if (gate.ctx.organizationId) {
    const { data } = await gate.ctx.supabase
      .from("reservations")
      .select("property_id, check_in, check_out, status, price")
      .eq("organization_id", gate.ctx.organizationId)
      .lt("check_in", to)
      .gt("check_out", from);
    if (data) reservations = data;
  }

  const metrics = computePmsMetrics({ from, to, rooms, reservations });
  const recommendations = buildRevenueRecommendations(metrics);

  if (format === "csv") {
    return new Response(metricsToCsv(metrics), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="metrics-${from}-${to}.csv"`,
      },
    });
  }

  const ai = prompt
    ? await runLlmAssistant({
        prompt,
        context: JSON.stringify({ metrics, recommendations }),
      })
    : await runLlmAssistant({
        prompt: "status",
        context: JSON.stringify({ metrics }),
      });

  return Response.json({
    metrics,
    recommendations,
    ai,
    autoApply: false,
  });
}

/** Assistant endpoint dedicado — nunca auto-apply precios. */
export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "analytics");
  if (mod) return mod;

  let body: { prompt?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return Response.json({ error: "prompt requerido" }, { status: 400 });
  }

  const ai = await runLlmAssistant({
    prompt,
    context: body.context,
  });

  return Response.json({
    ok: ai.ok,
    ai,
    autoApply: false as const,
    disclaimer: ai.disclaimer,
  });
}
