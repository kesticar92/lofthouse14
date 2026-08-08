import type { SupabaseClient } from "@supabase/supabase-js";
import { requireStaff } from "@/lib/api/require-staff";

const SIGNED_TTL = 60 * 60 * 24 * 7;

async function signFileUrl(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("expenses")
    .createSignedUrl(storagePath, SIGNED_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }

  const { data: exp, error: eErr } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (eErr) {
    return Response.json({ error: eErr.message }, { status: 500 });
  }
  if (!exp) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  const { data: files, error: fErr } = await supabase
    .from("expense_files")
    .select("*")
    .eq("expense_id", id)
    .order("created_at", { ascending: true });
  if (fErr) {
    return Response.json({ error: fErr.message }, { status: 500 });
  }

  const withUrls = await Promise.all(
    (files ?? []).map(async (f) => ({
      ...f,
      signed_url: await signFileUrl(supabase, f.storage_path as string),
    })),
  );

  return Response.json({ expense: exp, files: withUrls });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }

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

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.amount !== undefined) {
    const n = Number(body.amount);
    if (!Number.isFinite(n) || n < 0) {
      return Response.json({ error: "Monto inválido" }, { status: 400 });
    }
    patch.amount = n;
  }
  if (body.currency !== undefined) patch.currency = body.currency.trim();
  if (body.category !== undefined) patch.category = body.category.trim();
  if (body.vendor_name !== undefined)
    patch.vendor_name = body.vendor_name.trim();
  if (body.description !== undefined) {
    patch.description = body.description.trim();
  }
  if (body.expense_date !== undefined)
    patch.expense_date = body.expense_date.trim();
  if (body.notes !== undefined) patch.notes = body.notes.trim();

  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  return Response.json({ expense: data });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }

  const { data: files, error: fErr } = await supabase
    .from("expense_files")
    .select("storage_path")
    .eq("expense_id", id);
  if (fErr) {
    return Response.json({ error: fErr.message }, { status: 500 });
  }

  const paths = (files ?? [])
    .map((r) => r.storage_path as string)
    .filter(Boolean);
  if (paths.length > 0) {
    const { error: rmErr } = await supabase.storage
      .from("expenses")
      .remove(paths);
    if (rmErr) {
      return Response.json(
        { error: `No se pudo borrar archivos: ${rmErr.message}` },
        { status: 500 },
      );
    }
  }

  const { error: dErr } = await supabase.from("expenses").delete().eq("id", id);
  if (dErr) {
    return Response.json({ error: dErr.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
