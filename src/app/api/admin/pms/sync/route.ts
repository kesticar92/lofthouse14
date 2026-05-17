import { ApiHandlerError, apiHandler } from "@/lib/api/handler";
import { syncAllIcalSources } from "@/lib/pms/run-sync-all";

export const POST = apiHandler({
  module: "reservas",
  handler: async ({ ctx }) => {
    try {
      return await syncAllIcalSources(ctx.supabase);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new ApiHandlerError(msg, { status: 500 });
    }
  },
});
