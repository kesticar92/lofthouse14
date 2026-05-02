import { requireStaff } from "@/lib/api/require-staff";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "40") || 40),
  );

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, expense_files(id, drive_backup_status, drive_url, original_filename)",
    )
    .order("expense_date", { ascending: false })
    .limit(limit);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ expenses: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;

  let body: {
    amount?: number;
    currency?: string;
    category?: string;
    vendor_name?: string;
    description?: string;
    expense_date?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const expense_date = body.expense_date?.trim();
  if (!expense_date) {
    return Response.json({ error: "Falta expense_date" }, { status: 400 });
  }
  const amount = Number(body.amount ?? 0);
  if (!Number.isFinite(amount) || amount < 0) {
    return Response.json({ error: "Monto inválido" }, { status: 400 });
  }

  const row = {
    amount,
    currency: (body.currency ?? "COP").trim() || "COP",
    category: body.category?.trim() ?? "",
    vendor_name: body.vendor_name?.trim() ?? "",
    description: body.description?.trim() ?? "",
    expense_date,
    notes: body.notes?.trim() ?? "",
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("expenses")
    .insert(row)
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ expense: data });
}
