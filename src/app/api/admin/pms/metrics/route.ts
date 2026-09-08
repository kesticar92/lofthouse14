import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { computePmsMetrics } from "@/lib/pms/metrics";
import { listLocalReservations } from "@/lib/availability/local-store";
import { CATALOG_ROOMS } from "@/lib/catalog/seed";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "reservas");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const from =
    searchParams.get("from") ??
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const to =
    searchParams.get("to") ??
    new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10);

  const { supabase, organizationId } = gate.ctx;
  const activeRooms = CATALOG_ROOMS.filter((r) => r.status === "active").length;

  if (organizationId) {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("property_id, check_in, check_out, status, price")
      .eq("organization_id", organizationId)
      .lt("check_in", to)
      .gt("check_out", from);

    if (!error && reservations) {
      const metrics = computePmsMetrics({
        from,
        to,
        rooms: activeRooms,
        reservations,
      });
      return Response.json({ mode: "supabase", metrics });
    }
  }

  const local = listLocalReservations();
  const metrics = computePmsMetrics({
    from,
    to,
    rooms: activeRooms,
    reservations: local.map((r) => ({
      property_id: r.property_id,
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      price: r.price,
    })),
  });

  return Response.json({
    mode: "local",
    note: "Métricas desde store local / seed room count",
    metrics,
  });
}
