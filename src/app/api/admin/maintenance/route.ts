import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  createLocalMaintenanceTicket,
  listLocalMaintenanceTickets,
} from "@/lib/ops/maintenance";
import { addLocalBlock } from "@/lib/availability/local-store";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "aseos");
  if (denied) return denied;

  const { supabase, organizationId } = gate.ctx;
  if (organizationId) {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      return Response.json({ mode: "supabase", tickets: data });
    }
  }

  return Response.json({
    mode: "local",
    tickets: listLocalMaintenanceTickets(),
    note: "Store local / aplicar migración 025",
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const denied = enforceStaffModule(gate.ctx, "aseos");
  if (denied) return denied;

  let body: {
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    room_id?: string;
    legacy_property_id?: string;
    blocks_availability?: boolean;
    check_in?: string;
    check_out?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return Response.json({ error: "title requerido" }, { status: 400 });
  }

  const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;
  const blocks = Boolean(body.blocks_availability);

  if (gate.ctx.organizationId) {
    let blockId: string | null = null;
    if (blocks && body.legacy_property_id && body.check_in && body.check_out) {
      const { data: block } = await gate.ctx.supabase
        .from("availability_blocks")
        .insert({
          organization_id: orgId,
          property_id: body.legacy_property_id,
          start_date: body.check_in,
          end_date: body.check_out,
          reason: `maintenance: ${body.title}`,
          block_type: "out_of_service",
        })
        .select("id")
        .maybeSingle();
      blockId = block?.id ?? null;

      if (body.room_id) {
        await gate.ctx.supabase
          .from("rooms")
          .update({ status: "out_of_service", hk_status: "out_of_service" })
          .eq("id", body.room_id);
      }
    }

    const { data, error } = await gate.ctx.supabase
      .from("maintenance_tickets")
      .insert({
        organization_id: orgId,
        title: body.title.trim(),
        description: body.description ?? "",
        priority: body.priority ?? "medium",
        room_id: body.room_id ?? null,
        legacy_property_id: body.legacy_property_id ?? null,
        blocks_availability: blocks,
        block_id: blockId,
        created_by: gate.ctx.user.id,
        status: "open",
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      return Response.json({ mode: "supabase", ticket: data });
    }
  }

  const ticket = createLocalMaintenanceTicket(orgId, {
    title: body.title.trim(),
    description: body.description,
    priority: body.priority,
    roomId: body.room_id,
    legacyPropertyId: body.legacy_property_id,
    blocksAvailability: blocks,
  });

  if (blocks && body.legacy_property_id && body.check_in && body.check_out) {
    addLocalBlock({
      id: `block-${ticket.id}`,
      propertyId: body.legacy_property_id,
      start: body.check_in,
      endExclusive: body.check_out,
      kind: "out_of_service",
      status: "active",
    });
  }

  return Response.json({
    mode: "local",
    ticket,
    note: "Mock local — OUT_OF_SERVICE aplicado al store de availability si aplica",
  });
}
