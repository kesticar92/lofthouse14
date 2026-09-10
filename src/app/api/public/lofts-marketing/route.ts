import { resolveLoftCategories } from "@/lib/lofts-marketing/store";

/** Categorías marketing resueltas (seed + overrides `.data/`). Público. */
export async function GET() {
  const categories = resolveLoftCategories().map((c) => ({
    id: c.id,
    name: c.name,
    shortLabel: c.shortLabel,
    tagline: c.tagline,
    vistaLabel: c.vistaLabel,
    bedsLabel: c.bedsLabel,
    amenities: c.amenities,
    priceFromCop: c.priceFromCop,
    maxGuests: c.maxGuests,
    image: c.image,
    images: c.images,
    imageAlt: c.imageAlt,
    theme: c.theme,
  }));
  return Response.json(
    { categories },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    },
  );
}
