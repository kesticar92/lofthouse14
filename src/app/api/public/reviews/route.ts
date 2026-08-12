import { NextResponse } from "next/server";
import {
  buildTestimonials,
  countBySource,
} from "@/lib/reviews/build-testimonials";
import { fetchTestimonialsFromSupabase } from "@/lib/reviews/supabase-reviews";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const bundled = buildTestimonials();
  const fromSupabase = await fetchTestimonialsFromSupabase();
  const testimonials =
    fromSupabase && fromSupabase.length > 0 ? fromSupabase : bundled;

  return NextResponse.json({
    testimonials,
    counts: countBySource(testimonials),
    source: fromSupabase?.length ? "supabase" : "bundled",
  });
}
