import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/api/require-staff";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const ALL_MODULES = ["cotizaciones", "inventario", "reservas", "gastos", "aseos"];

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { profile } = gate.ctx;
  if (profile.role !== "super_admin" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  const { data, error: dbErr } = await admin
    .from("profiles")
    .select("id, email, full_name, role, status, allowed_modules, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { profile } = gate.ctx;
  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Solo el super_admin puede modificar usuarios" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { id, status, role, allowed_modules, full_name } = body as {
    id: string;
    status?: string;
    role?: string;
    allowed_modules?: string[];
    full_name?: string;
  };

  if (status && !["pending", "active", "suspended"].includes(status)) {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }
  if (role && !["super_admin", "admin", "staff"].includes(role)) {
    return NextResponse.json({ error: "role inválido" }, { status: 400 });
  }
  if (allowed_modules) {
    const invalid = allowed_modules.filter((m) => !ALL_MODULES.includes(m));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Módulos inválidos: ${invalid.join(", ")}` }, { status: 400 });
    }
  }

  const admin = createServiceRoleClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (role !== undefined) updates.role = role;
  if (allowed_modules !== undefined) updates.allowed_modules = allowed_modules;
  if (full_name !== undefined) updates.full_name = full_name;

  const { data, error: dbErr } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("id, email, full_name, role, status, allowed_modules")
    .maybeSingle();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
