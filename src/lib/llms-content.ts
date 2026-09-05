import { site } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";
import { allBookableUnits } from "@/data/lofts-catalog";
import { BLOG_POSTS } from "@/data/blog-posts";
import { aggregateReviews } from "@/lib/seo";

export function llmsTxt(): string {
  const agg = aggregateReviews();
  const url = getSiteUrl();
  return `# Lofthouse 14 — Lofts en Cali, Colombia
> Alojamiento de lofts modernos en barrio Miraflores, Cali.
> A pasos del Parque del Perro y San Fernando.
> 14 lofts privados, capacidad hasta ${site.maxGuests} personas en total.
> Desde $80.000 COP/noche. Check-in autónomo. WiFi, A/C, cocina.
> Ideal: turistas, nómadas digitales, médicos en rotación, grupos.
> ${agg.reviewCount} reseñas verificadas (Google, Booking, Airbnb). Puntuación ${agg.ratingValue}/5.
> Dirección: ${site.addressLine}, Miraflores, Cali, Valle del Cauca, Colombia.
> Teléfono / WhatsApp: ${site.phoneDisplay}
> Reservas: ${url} | ${url}/reservas

## Páginas
- Inicio: ${url}/
- Lofts: ${url}/lofts
- Ubicación: ${url}/ubicacion-miraflores-cali
- Reseñas: ${url}/resenas
- Reservas: ${url}/reservas
- Blog: ${url}/blog
`;
}

export function llmsFullTxt(): string {
  const agg = aggregateReviews();
  const url = getSiteUrl();
  const units = allBookableUnits
    .map(
      (unit) => `### ${unit.name} — ${unit.headline}
- URL: ${url}/lofts/${unit.slug}
- Capacidad: ${unit.guestsIdeal}–${unit.guestsMax} personas
- Desde: $${unit.priceFromCop.toLocaleString("es-CO")} COP/noche
- ${unit.shortDescription}
`,
    )
    .join("\n");
  const posts = BLOG_POSTS.map(
    (post) => `- ${post.title}: ${url}/blog/${post.slug}`,
  ).join("\n");
  return `${llmsTxt()}
## Unidades
${units}

## Reseñas
${agg.reviewCount} reseñas (Google ${agg.google}, Booking ${agg.booking}, Airbnb ${agg.airbnb}).

## Blog
${posts}
`;
}
