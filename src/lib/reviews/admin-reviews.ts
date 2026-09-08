/**
 * Reviews admin helpers — listado + sentiment stub + categorías.
 */

import type { ReviewSource, Testimonial } from "@/lib/reviews/types";

export type ReviewSentiment = "positive" | "neutral" | "negative";

export type ReviewCategory =
  | "cleanliness"
  | "location"
  | "value"
  | "service"
  | "amenities"
  | "general";

export type AdminReviewRow = Testimonial & {
  sentiment: ReviewSentiment;
  categories: ReviewCategory[];
};

const POSITIVE_WORDS =
  /\b(excelente|increíble|increible|hermoso|hermosa|recomend|perfecto|limpia|limpio|genial|fantast|maravill|amable|comodo|cómodo|beautiful|amazing|great|clean|recommend)\b/i;
const NEGATIVE_WORDS =
  /\b(malo|mala|sucio|sucia|ruido|problema|horrible|pésimo|pesimo|caro|demora|dirty|noise|bad|worst|terrible)\b/i;

export function stubSentiment(text: string, starRating: number): ReviewSentiment {
  if (starRating >= 4) {
    if (NEGATIVE_WORDS.test(text) && !POSITIVE_WORDS.test(text)) return "neutral";
    return "positive";
  }
  if (starRating <= 2) {
    if (POSITIVE_WORDS.test(text) && !NEGATIVE_WORDS.test(text)) return "neutral";
    return "negative";
  }
  if (POSITIVE_WORDS.test(text) && !NEGATIVE_WORDS.test(text)) return "positive";
  if (NEGATIVE_WORDS.test(text) && !POSITIVE_WORDS.test(text)) return "negative";
  return "neutral";
}

export function stubCategories(text: string): ReviewCategory[] {
  const cats = new Set<ReviewCategory>();
  const t = text.toLowerCase();
  if (/limp|aseo|clean|orden/.test(t)) cats.add("cleanliness");
  if (/ubic|location|centro|barrio|cerca|transporte/.test(t)) cats.add("location");
  if (/precio|valor|value|barat|caro|relación/.test(t)) cats.add("value");
  if (/atenci|service|staff|amable|anfitri|host/.test(t)) cats.add("service");
  if (/wifi|cocina|amenit|cama|baño|ducha|equip/.test(t)) cats.add("amenities");
  if (cats.size === 0) cats.add("general");
  return [...cats];
}

export function enrichReviewsForAdmin(
  testimonials: Testimonial[],
): AdminReviewRow[] {
  return testimonials.map((t) => ({
    ...t,
    sentiment: stubSentiment(t.text, t.starRating),
    categories: stubCategories(t.text),
  }));
}

export function filterAdminReviews(
  rows: AdminReviewRow[],
  opts: {
    source?: ReviewSource | "all";
    sentiment?: ReviewSentiment | "all";
    category?: ReviewCategory | "all";
    q?: string;
  },
): AdminReviewRow[] {
  const q = opts.q?.trim().toLowerCase() ?? "";
  return rows.filter((r) => {
    if (opts.source && opts.source !== "all" && r.source !== opts.source) {
      return false;
    }
    if (
      opts.sentiment &&
      opts.sentiment !== "all" &&
      r.sentiment !== opts.sentiment
    ) {
      return false;
    }
    if (
      opts.category &&
      opts.category !== "all" &&
      !r.categories.includes(opts.category)
    ) {
      return false;
    }
    if (q) {
      const hay = `${r.name} ${r.text} ${r.loftCode ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function reviewStats(rows: AdminReviewRow[]) {
  const bySentiment = { positive: 0, neutral: 0, negative: 0 };
  const bySource: Record<string, number> = {};
  for (const r of rows) {
    bySentiment[r.sentiment] += 1;
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  }
  return { total: rows.length, bySentiment, bySource };
}
