import { createClient } from "@supabase/supabase-js";
import type { Testimonial } from "@/lib/reviews/types";

function createAnonReviewsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type GuestReviewRow = {
  id: string;
  source: Testimonial["source"];
  name: string;
  body: string;
  image: string;
  star_rating: number;
  booking_score: number | null;
  review_date: string | null;
  listing_url: string | null;
  listing_label: string | null;
  loft_code: string | null;
  booking_positive: string | null;
  booking_negative: string | null;
  synced_at: string;
};

function rowToTestimonial(row: GuestReviewRow): Testimonial {
  return {
    id: row.id,
    text: row.body,
    image: row.image,
    name: row.name,
    starRating: Number(row.star_rating) || 0,
    bookingScore:
      row.booking_score != null ? Number(row.booking_score) : undefined,
    source: row.source,
    reviewDate: row.review_date,
    listingUrl: row.listing_url ?? undefined,
    listingLabel: row.listing_label ?? undefined,
    loftCode: row.loft_code ?? undefined,
    bookingPositive: row.booking_positive,
    bookingNegative: row.booking_negative,
  };
}

export function testimonialToGuestReviewRow(
  t: Testimonial,
  syncedAt: string,
): GuestReviewRow {
  return {
    id: t.id,
    source: t.source,
    name: t.name,
    body: t.text,
    image: t.image || "/default-avatar.png",
    star_rating: t.starRating,
    booking_score: t.bookingScore ?? null,
    review_date: t.reviewDate,
    listing_url: t.listingUrl ?? null,
    listing_label: t.listingLabel ?? null,
    loft_code: t.loftCode ?? null,
    booking_positive: t.bookingPositive ?? null,
    booking_negative: t.bookingNegative ?? null,
    synced_at: syncedAt,
  };
}

/** Lee todas las reseñas publicadas en Supabase (orden: fecha desc). */
export async function fetchTestimonialsFromSupabase(): Promise<
  Testimonial[] | null
> {
  const supabase = createAnonReviewsClient();
  if (!supabase) return null;

  const pageSize = 1000;
  let from = 0;
  const all: GuestReviewRow[] = [];

  for (;;) {
    const { data, error } = await supabase
      .from("guest_reviews")
      .select("*")
      .order("review_date", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("[guest_reviews] fetch:", error.message);
      return null;
    }
    if (!data?.length) break;
    all.push(...(data as GuestReviewRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  if (all.length === 0) return null;
  return all.map(rowToTestimonial);
}
