import { z } from "zod";

import { ApiHandlerError, apiHandler } from "@/lib/api/handler";

function monthRange(isoMonth: string): { start: string; end: string } {
  const [y, m] = isoMonth.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

const querySchema = z.object({
  date: z.string().optional(),
  month: z.string().optional(),
});

export const GET = apiHandler({
  module: "aseos",
  query: querySchema,
  handler: async ({ query, ctx }) => {
    const today = query.date?.trim() ?? new Date().toISOString().slice(0, 10);
    const month = query.month?.trim() ?? today.slice(0, 7);
    const { start: mStart, end: mEnd } = monthRange(month);

    const { data: todayTasks, error: e1 } = await ctx.supabase
      .from("cleaning_tasks")
      .select("id, type, cleaning_price, status")
      .eq("task_date", today);
    if (e1) throw new ApiHandlerError(e1.message, { status: 500 });

    const { data: monthTasks, error: e2 } = await ctx.supabase
      .from("cleaning_tasks")
      .select("id, cleaning_price, status")
      .gte("task_date", mStart)
      .lte("task_date", mEnd);
    if (e2) throw new ApiHandlerError(e2.message, { status: 500 });

    const tt = todayTasks ?? [];
    const cleaningToday = tt.filter((t) => t.type === "cleaning").length;
    const prepToday = tt.filter((t) => t.type === "preparation").length;
    const manualToday = tt.filter((t) => t.type === "manual").length;

    const sumPrices = (rows: { cleaning_price: number | null }[]) =>
      rows.reduce((s, r) => s + Number(r.cleaning_price ?? 0), 0);

    const revenueTodayScheduled = sumPrices(tt);
    const revenueTodayDone = sumPrices(tt.filter((t) => t.status === "done"));

    const mt = monthTasks ?? [];
    const revenueMonthScheduled = sumPrices(mt);
    const revenueMonthDone = sumPrices(mt.filter((t) => t.status === "done"));

    return {
      date: today,
      month,
      today: {
        cleaning: cleaningToday,
        preparation: prepToday,
        manual: manualToday,
        revenue_scheduled_cop: revenueTodayScheduled,
        revenue_done_cop: revenueTodayDone,
      },
      month_totals: {
        revenue_scheduled_cop: revenueMonthScheduled,
        revenue_done_cop: revenueMonthDone,
        task_count: mt.length,
      },
    };
  },
});
