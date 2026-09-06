import { getFaqSchemaItems } from "@/data/faq";
import { allBookableUnits, type LoftUnit } from "@/data/lofts-catalog";
import {
  buildTestimonials,
  countBySource,
} from "@/lib/reviews/build-testimonials";
import { site } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";
import type { Testimonial } from "@/lib/reviews/types";

export const SEO_TITLE_HOME =
  "Lofts en Cali Miraflores · Parque del Perro | Lofthouse 14";

export const SEO_DESCRIPTION_HOME =
  "Lofts modernos en Cali, barrio Miraflores, a pasos del Parque del Perro. WiFi, A/C, cocina equipada. Desde $90.000/noche. Check-in autónomo. Reserva directo aquí.";

export const SEO_KEYWORDS = [
  "loft cali",
  "hospedaje en cali miraflores",
  "alojamiento cali parque del perro",
  "loft en alquiler cali",
  "apartamento amoblado cali corta estancia",
  "donde hospedarse en cali colombia",
  "hotel cerca parque del perro cali",
  "alojamiento para grupos cali",
  "hospedaje medico cali clinica",
  "apartamento nomadas digitales cali",
  "hospedaje san fernando cali",
] as const;

export type ReviewAggregate = {
  ratingValue: number;
  reviewCount: number;
  google: number;
  airbnb: number;
  booking: number;
};

function starOf(review: Testimonial): number {
  if (review.source === "booking") {
    const score = review.bookingScore ?? 8;
    return Math.min(5, Math.max(0, score / 2));
  }
  return review.starRating || 0;
}

export function aggregateReviews(
  items: Testimonial[] = buildTestimonials(),
): ReviewAggregate {
  const counts = countBySource(items);
  const sum = items.reduce((acc, item) => acc + starOf(item), 0);
  const ratingValue =
    items.length === 0 ? 0 : Math.round((sum / items.length) * 10) / 10;
  return {
    ratingValue,
    reviewCount: counts.total,
    google: counts.google,
    airbnb: counts.airbnb,
    booking: counts.booking,
  };
}

export function featuredReviews(limit = 5): Testimonial[] {
  return buildTestimonials()
    .filter((item) => item.text.length > 80 && !item.text.startsWith("0ahUK"))
    .slice(0, limit);
}

export function lodgingBusinessJsonLd(agg = aggregateReviews()) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Lofthouse 14",
    alternateName: site.name,
    description: SEO_DESCRIPTION_HOME,
    url,
    image: allBookableUnits.slice(0, 6).map((unit) => `${url}${unit.image}`),
    telephone: site.phoneTel,
    email: site.email,
    priceRange: "$$",
    currenciesAccepted: "COP",
    paymentAccepted: "Cash, Credit Card, Nequi, Daviplata",
    checkinTime: "15:00",
    checkoutTime: "11:00",
    numberOfRooms: site.maxLofts,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.addressLine,
      addressLocality: "Cali",
      addressRegion: "Valle del Cauca",
      postalCode: "760044",
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
      ratingValue: String(agg.ratingValue),
      reviewCount: String(agg.reviewCount),
      bestRating: "5",
      worstRating: "1",
    },
    amenityFeature: LOFT_AMENITY_SCHEMA,
    sameAs: [site.instagramUrl, site.tiktokUrl, site.google_url],
  };
}

const LOFT_AMENITY_SCHEMA = [
  { "@type": "LocationFeatureSpecification", name: "WiFi", value: true },
  {
    "@type": "LocationFeatureSpecification",
    name: "Aire acondicionado",
    value: true,
  },
  {
    "@type": "LocationFeatureSpecification",
    name: "Cocina equipada",
    value: true,
  },
  { "@type": "LocationFeatureSpecification", name: "Smart TV", value: true },
  {
    "@type": "LocationFeatureSpecification",
    name: "Check-in autónomo",
    value: true,
  },
  {
    "@type": "LocationFeatureSpecification",
    name: "Permitido mascotas",
    value: true,
  },
];

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lofthouse 14",
    url,
    logo: `${url}/logo-lofthouse.png`,
    email: site.email,
    telephone: site.phoneTel,
    sameAs: [site.instagramUrl, site.tiktokUrl],
    address: {
      "@type": "PostalAddress",
      streetAddress: site.addressLine,
      addressLocality: "Cali",
      addressRegion: "Valle del Cauca",
      addressCountry: "CO",
    },
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lofthouse 14",
    url,
    inLanguage: "es-CO",
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/lofts/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getFaqSchemaItems().map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${url}${item.path}`,
    })),
  };
}

export function hotelRoomJsonLd(unit: LoftUnit, agg = aggregateReviews()) {
  const url = getSiteUrl();
  const page = `${url}/lofts/${unit.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": unit.type === "casa" ? "Apartment" : "HotelRoom",
    name: `${unit.name} — ${unit.headline}`,
    description: unit.shortDescription,
    url: page,
    image: unit.gallery.map((src) => `${url}${src}`),
    occupancy: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: unit.guestsMax,
    },
    containedInPlace: {
      "@type": "LodgingBusiness",
      name: "Lofthouse 14",
      url,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: unit.priceFromCop,
      availability: "https://schema.org/InStock",
      url: page,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(agg.ratingValue),
      reviewCount: String(agg.reviewCount),
      bestRating: "5",
      worstRating: "1",
    },
  };
}

export function reviewGraphJsonLd(reviews = featuredReviews(5)) {
  const url = getSiteUrl();
  return reviews.map((review) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: review.name },
    datePublished: review.reviewDate ?? undefined,
    reviewBody: review.text.slice(0, 400),
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(starOf(review)),
      bestRating: "5",
    },
    itemReviewed: {
      "@type": "LodgingBusiness",
      name: "Lofthouse 14",
      url,
    },
  }));
}

export function sitewideJsonLdGraph() {
  return [lodgingBusinessJsonLd(), organizationJsonLd(), websiteJsonLd()];
}

export function homeExtraJsonLd() {
  return [faqPageJsonLd(), ...reviewGraphJsonLd()];
}
