import { requireStaff } from "@/lib/api/require-staff";

/** Lista perfiles staff para asignar tareas (solo admin / super_admin). */
export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { supabase, user } = gate.ctx;

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "super_admin" && me?.role !== "admin") {
    const { data: self } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", user.id)
      .maybeSingle();
    return Response.json({ staff: self ? [self] : [] });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["staff", "admin", "super_admin"])
    .order("full_name");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ staff: data ?? [] });
}
