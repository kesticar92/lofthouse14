import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/api/require-staff";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase } = gate.ctx;
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, ical_token, created_at, updated_at")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ properties: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, profile } = gate.ctx;
  if (profile.role !== "super_admin" && profile.role !== "admin") {
    return NextResponse.json({ error: "Solo admin puede crear propiedades" }, { status: 403 });
  }
  let body: { name?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  const token = randomBytes(24).toString("hex");
  const { data, error } = await supabase
    .from("properties")
    .insert({ name, ical_token: token })
    .select("id, name, ical_token, created_at, updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ property: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, profile } = gate.ctx;
  if (profile.role !== "super_admin" && profile.role !== "admin") {
    return NextResponse.json({ error: "Solo admin puede editar propiedades" }, { status: 403 });
  }
  let body: { id?: string; name?: string; regenerate_ical_token?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Falta id de propiedad" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.regenerate_ical_token) updates.ical_token = randomBytes(24).toString("hex");
  if (body.name?.trim()) updates.name = body.name.trim();

  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", id)
    .select("id, name, ical_token, updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ property: data });
}

export async function DELETE(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, profile } = gate.ctx;
  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Solo super_admin puede eliminar propiedades" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  // La confirmación es responsabilidad del cliente. La FK `reservations`,
  // `ical_sources`, `availability_blocks` y `cleaning_tasks` ya están con
  // ON DELETE CASCADE, por lo que al eliminar el anuncio se limpian sus
  // datos asociados de forma atómica.
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
