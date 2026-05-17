import { ApiHandlerError, apiHandler } from "@/lib/api/handler";

/** Lista perfiles staff para asignar tareas de aseo. */
export const GET = apiHandler({
  module: "aseos",
  handler: async ({ ctx }) => {
    const { supabase, user } = ctx;
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
      return { staff: self ? [self] : [] };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["staff", "admin", "super_admin"])
      .order("full_name");
    if (error) throw new ApiHandlerError(error.message, { status: 500 });
    return { staff: data ?? [] };
  },
});
