import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { computePmsMetrics } from "@/lib/pms/metrics";
import {
  channelRevenueBreakdown,
  occupancyRevenueCsv,
} from "@/lib/analytics/export-reports";
import { listLocalReservations } from "@/lib/availability/local-store";
import { CATALOG_ROOMS } from "@/lib/catalog/seed";
import { buildRevenueRecommendations } from "@/lib/analytics/reports";

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

  const rooms = CATALOG_ROOMS.filter((r) => r.status === "active").length;
  let reservations = listLocalReservations().map((r) => ({
    property_id: r.property_id,
    check_in: r.check_in,
    check_out: r.check_out,
    status: r.status,
    price: r.price,
    channel: r.channel,
    source: r.source,
  }));

  if (gate.ctx.organizationId) {
    const { data } = await gate.ctx.supabase
      .from("reservations")
      .select("property_id, check_in, check_out, status, price, channel, source")
      .eq("organization_id", gate.ctx.organizationId)
      .lt("check_in", to)
      .gt("check_out", from);
    if (data) {
      reservations = data.map((r) => ({
        ...r,
        channel: (r as { channel?: string }).channel ?? null,
        source: (r as { source?: string }).source ?? null,
      }));
    }
  }

  const metrics = computePmsMetrics({ from, to, rooms, reservations });
  const channels = channelRevenueBreakdown(reservations, from, to);
  const recommendations = buildRevenueRecommendations(metrics);

  if (format === "csv" || format === "excel") {
    const body = occupancyRevenueCsv({ metrics, channels });
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reportes-${from}-${to}.csv"`,
      },
    });
  }

  return Response.json({
    from,
    to,
    metrics,
    channels,
    recommendations,
    mode: "local",
  });
}
