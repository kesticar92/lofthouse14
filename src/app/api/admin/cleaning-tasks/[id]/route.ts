import { requireStaff } from "@/lib/api/require-staff";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }

  let body: {
    status?: string;
    assigned_to?: string | null;
    notes?: string;
    cleaning_price?: number | null;
    bed_setup_notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { data: cur, error: curErr } = await supabase
    .from("cleaning_tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (curErr) {
    return Response.json({ error: curErr.message }, { status: 500 });
  }
  if (!cur) {
    return Response.json({ error: "No encontrada" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isSuper = profile?.role === "super_admin" || profile?.role === "admin";

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!["pending", "in_progress", "done"].includes(body.status)) {
      return Response.json({ error: "status inválido" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.bed_setup_notes !== undefined) {
    patch.bed_setup_notes = body.bed_setup_notes;
  }
  if (body.cleaning_price !== undefined) {
    if (!isSuper) {
      return Response.json(
        { error: "Prohibido: solo supervisor edita precio" },
        {
          status: 403,
        },
      );
    }
    patch.cleaning_price = body.cleaning_price;
  }
  if (body.assigned_to !== undefined) {
    if (!isSuper) {
      return Response.json(
        { error: "Prohibido: solo supervisor asigna personal" },
        { status: 403 },
      );
    }
    patch.assigned_to = body.assigned_to;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Sin cambios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cleaning_tasks")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ task: data });
}
