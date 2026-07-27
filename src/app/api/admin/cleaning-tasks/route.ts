import { requireStaff } from "@/lib/api/require-staff";
import {
  computeCleaningPrice,
  parseCleaningPricing,
} from "@/lib/pms/cleaning-pricing";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const date =
    new URL(req.url).searchParams.get("date")?.trim() ??
    new Date().toISOString().slice(0, 10);

  const { data: tasks, error } = await supabase
    .from("cleaning_tasks")
    .select("*")
    .eq("task_date", date)
    .order("estimated_time_label", { ascending: true });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const ids = [...new Set((tasks ?? []).map((t) => t.property_id))];
  let propNames: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: props } = await supabase
      .from("properties")
      .select("id,name")
      .in("id", ids);
    propNames = Object.fromEntries((props ?? []).map((p) => [p.id, p.name]));
  }

  const enriched = (tasks ?? []).map((t) => ({
    ...t,
    property_name: propNames[t.property_id] ?? "—",
  }));

  return Response.json({ tasks: enriched, date });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;

  let body: {
    property_id?: string;
    task_date?: string;
    notes?: string;
    guests?: number;
    assigned_to?: string | null;
    cleaning_price?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const property_id = body.property_id?.trim();
  const task_date = body.task_date?.trim();
  if (!property_id || !task_date) {
    return Response.json(
      { error: "Faltan property_id o task_date" },
      { status: 400 },
    );
  }

  const guests = Number(body.guests ?? 1);
  if (!Number.isFinite(guests) || guests < 1) {
    return Response.json({ error: "guests inválido" }, { status: 400 });
  }

  let price = body.cleaning_price ?? null;
  if (price == null) {
    const { data: row } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "cleaning_pricing")
      .maybeSingle();
    const rules = parseCleaningPricing(row?.value);
    price = computeCleaningPrice(guests, rules);
  }

  const { data, error } = await supabase
    .from("cleaning_tasks")
    .insert({
      property_id,
      reservation_id: null,
      task_date,
      type: "manual",
      status: "pending",
      guests,
      source: "manual",
      guest_name: "",
      notes: body.notes?.trim() ?? "",
      bed_setup_notes: "",
      cleaning_price: price,
      estimated_time_label: "Tarea manual",
      assigned_to: body.assigned_to?.trim() || null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ task: data });
}
