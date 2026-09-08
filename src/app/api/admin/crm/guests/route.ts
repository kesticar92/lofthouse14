import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { LOFTHOUSE_ORGANIZATION_ID } from "@/lib/tenant/constants";
import { listLocalReservations } from "@/lib/availability/local-store";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  const { supabase, organizationId } = gate.ctx;
  if (organizationId) {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (!error && data) {
      return Response.json({ mode: "supabase", guests: data });
    }
  }

  const map = new Map<
    string,
    { full_name: string; email: string; phone: string }
  >();
  for (const r of listLocalReservations()) {
    const key = r.guest_email || r.guest_phone || r.guest_name;
    if (!map.has(key)) {
      map.set(key, {
        full_name: r.guest_name,
        email: r.guest_email,
        phone: r.guest_phone,
      });
    }
  }

  return Response.json({
    mode: "local",
    organization_id: organizationId ?? LOFTHOUSE_ORGANIZATION_ID,
    guests: [...map.entries()].map(([id, g]) => ({ id, ...g })),
    note: "Perfiles derivados de reservas locales / aplicar 026",
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  let body: {
    full_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orgId = gate.ctx.organizationId ?? LOFTHOUSE_ORGANIZATION_ID;
  if (gate.ctx.organizationId) {
    const { data, error } = await gate.ctx.supabase
      .from("guests")
      .insert({
        organization_id: orgId,
        full_name: body.full_name?.trim() ?? "",
        email: body.email?.trim() ?? "",
        phone: body.phone?.trim() ?? "",
        notes: body.notes?.trim() ?? "",
      })
      .select("*")
      .maybeSingle();
    if (!error && data) return Response.json({ mode: "supabase", guest: data });
  }

  return Response.json({
    mode: "local",
    guest: {
      id: `guest-${Date.now()}`,
      organization_id: orgId,
      full_name: body.full_name ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      notes: body.notes ?? "",
    },
    note: "Stub local",
  });
}
