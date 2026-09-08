import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { stubAutomationEvent, type AutomationEventType } from "@/lib/crm/templates";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  const { supabase, organizationId } = gate.ctx;
  if (organizationId) {
    const { data } = await supabase
      .from("automation_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) return Response.json({ mode: "supabase", events: data });
  }

  return Response.json({
    mode: "empty",
    events: [],
    note: "Sin eventos — POST para crear stub",
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  let body: { event_type?: AutomationEventType; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const event = stubAutomationEvent(
    body.event_type ?? "custom",
    body.payload ?? {},
  );
  const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;

  if (gate.ctx.organizationId) {
    const { data } = await gate.ctx.supabase
      .from("automation_events")
      .insert({
        organization_id: orgId,
        event_type: event.event_type,
        payload: event.payload,
        status: "stub",
        message: event.message,
      })
      .select("*")
      .maybeSingle();
    if (data) return Response.json({ mode: "supabase", event: data });
  }

  return Response.json({ mode: "local", event });
}
