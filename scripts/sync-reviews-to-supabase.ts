/**
 * Sincroniza reseñas desde JSON locales → Supabase (service role).
 * Uso: npm run reviews:sync-supabase (tras npm run reviews:scrape).
 */
import { createClient } from "@supabase/supabase-js";
import { buildTestimonials } from "@/lib/reviews/build-testimonials";
import { testimonialToGuestReviewRow } from "@/lib/reviews/supabase-reviews";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testimonials = buildTestimonials();
const syncedAt = new Date().toISOString();
const rows = testimonials.map((t) =>
  testimonialToGuestReviewRow(t, syncedAt),
);

const chunkSize = 200;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize);
  const { error } = await supabase.from("guest_reviews").upsert(chunk, {
    onConflict: "id",
  });
  if (error) {
    console.error("Upsert falló:", error.message);
    process.exit(1);
  }
}

const { error: staleError } = await supabase
  .from("guest_reviews")
  .delete()
  .lt("synced_at", syncedAt);

if (staleError) {
  console.warn("Limpieza de reseñas obsoletas:", staleError.message);
}

console.log(`✓ Supabase: ${rows.length} reseñas sincronizadas.`);
