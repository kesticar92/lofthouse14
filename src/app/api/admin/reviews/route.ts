import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import { buildTestimonials } from "@/lib/reviews/build-testimonials";
import { fetchTestimonialsFromSupabase } from "@/lib/reviews/supabase-reviews";
import {
  enrichReviewsForAdmin,
  filterAdminReviews,
  reviewStats,
  type ReviewCategory,
  type ReviewSentiment,
} from "@/lib/reviews/admin-reviews";
import type { ReviewSource } from "@/lib/reviews/types";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  const { searchParams } = new URL(req.url);
  const source = (searchParams.get("source") ?? "all") as ReviewSource | "all";
  const sentiment = (searchParams.get("sentiment") ??
    "all") as ReviewSentiment | "all";
  const category = (searchParams.get("category") ??
    "all") as ReviewCategory | "all";
  const q = searchParams.get("q") ?? "";

  const bundled = buildTestimonials();
  const fromSupabase = await fetchTestimonialsFromSupabase();
  const base =
    fromSupabase && fromSupabase.length > 0 ? fromSupabase : bundled;
  const enriched = enrichReviewsForAdmin(base);
  const filtered = filterAdminReviews(enriched, {
    source,
    sentiment,
    category,
    q,
  });

  return Response.json({
    mode: fromSupabase?.length ? "supabase" : "bundled",
    reviews: filtered,
    stats: reviewStats(enriched),
    filtered_stats: reviewStats(filtered),
    note: "Sentiment/categorías = stub heurístico local",
  });
}
