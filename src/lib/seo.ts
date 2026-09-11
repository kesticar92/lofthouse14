import { site } from "@/lib/site";
import { LOFTS } from "@/data/lofts";
import { FAQ_ITEMS } from "@/data/faq";
import { REVIEW_HIGHLIGHTS } from "@/data/reviews";

/**
 * URL canónica del sitio. Nunca publicar localhost/127.* en metadata/schema.
 * Preferir www para alinear sitemap, robots y hreflang.
 */
function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.lofthouse14.com")
    .trim()
    .replace(/\/$/, "");

  const fallback = "https://www.lofthouse14.com";
  if (!raw) return fallback;

  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.")
    ) {
      if (process.env.NODE_ENV === "production") return fallback;
    }
    // Unificar apex → www
    if (host === "lofthouse14.com") {
      return `https://www.lofthouse14.com`;
    }
    return `${u.protocol}//${u.host}`;
  } catch {
    return fallback;
  }
}

export const SITE_URL = resolveSiteUrl();

export const SEO = {
  titleDefault:
    "Lofts en Cali con Cocina · Barrio Miraflores | Lofthouse 14",
  titleTemplate: "%s | Lofthouse 14",
  description:
    "Lofts modernos en Cali, barrio Miraflores, a pasos del Parque del Perro. WiFi, A/C, cocina equipada. Desde $90.000/noche. Check-in autónomo. ¡Reserva directo aquí!",
  ogImage: "/gallery/immersive/18-sala_cocina_escalera.webp",
  ogImageAlt:
    "Loft moderno en Cali Miraflores con cocina y sala — Lofthouse 14",
  keywords: [
    "lofts en cali",
    "loft cali miraflores",
    "hospedaje parque del perro",
    "apartaestudio miraflores cali",
    "alojamiento cali cocina",
    "lofts para grupos cali",
    "nómadas digitales cali",
    "alojamiento médico cali",
    "lofthouse 14",
  ],
  ratingValue: 4.8,
  reviewCount: 388,
  priceFromUsdApprox: 20,
} as const;

export function absoluteUrl(path = "/") {
  const base = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function lodgingBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE_URL}/#lodging`,
    name: site.name,
    alternateName: "Lofthouse 14",
    description: SEO.description,
    url: SITE_URL,
    image: [
      absoluteUrl("/logo-lofthouse.png"),
      absoluteUrl(SEO.ogImage),
      ...site.gallery.map((p) => absoluteUrl(p)),
    ],
    telephone: site.phoneTel,
    email: site.email,
    priceRange: "$$",
    currenciesAccepted: "COP, USD",
    paymentAccepted: "Transferencia, Nequi, Daviplata, Cash",
    checkinTime: "15:00",
    checkoutTime: "11:00",
    numberOfRooms: site.maxLofts,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "WiFi", value: true },
      {
        "@type": "LocationFeatureSpecification",
        name: "Air conditioning",
        value: true,
      },
      { "@type": "LocationFeatureSpecification", name: "Kitchen", value: true },
      {
        "@type": "LocationFeatureSpecification",
        name: "Self check-in",
        value: true,
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: site.addressLine,
      addressLocality: site.city,
      addressRegion: "Valle del Cauca",
      postalCode: "760042",
      addressCountry: "CO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.coordinates.latitude,
      longitude: site.coordinates.longitude,
    },
    hasMap: site.google_url,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: SEO.ratingValue,
      reviewCount: SEO.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    sameAs: [site.instagramUrl, site.tiktokUrl, site.google_url],
  };
}

export function websiteJsonLd() {
  // Sin SearchAction: /lofts no implementa búsqueda por ?q= (evita Action engañosa).
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: site.name,
    url: SITE_URL,
    inLanguage: ["es-CO", "en"],
  };
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function hotelRoomJsonLd(loft: (typeof LOFTS)[number]) {
  return {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: loft.name,
    description: loft.description,
    url: absoluteUrl(`/lofts/${loft.slug}`),
    image: loft.images.map((src) => absoluteUrl(src)),
    bed: {
      "@type": "BedDetails",
      typeOfBed: loft.bedType,
      numberOfBeds: loft.beds,
    },
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: loft.maxGuests,
    },
    amenityFeature: loft.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    containedInPlace: { "@id": `${SITE_URL}/#lodging` },
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: loft.priceFromCop,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/lofts/${loft.slug}`),
    },
  };
}

export function reviewsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE_URL}/#lodging`,
    name: site.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: SEO.ratingValue,
      reviewCount: SEO.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: REVIEW_HIGHLIGHTS.slice(0, 8).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.stars,
        bestRating: 5,
      },
      reviewBody: r.text,
      datePublished: r.date,
    })),
  };
}
